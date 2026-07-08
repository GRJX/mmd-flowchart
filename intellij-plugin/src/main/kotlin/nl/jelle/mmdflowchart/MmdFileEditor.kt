package nl.jelle.mmdflowchart

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.fileChooser.FileChooserFactory
import com.intellij.openapi.fileChooser.FileSaverDescriptor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorState
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.util.UserDataHolderBase
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefJSQuery
import java.beans.PropertyChangeListener
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.Base64
import javax.swing.JComponent

/**
 * IntelliJ host for the MMD Flowchart webview — the Kotlin mirror of the
 * VSCode extension host (vscode-extension/src/extension.ts). The IDE owns
 * the document entirely (buffer, dirty state, save, text undo); the
 * webview only exchanges *content* over the protocol defined in
 * src/lib/host/protocol.ts:
 *
 *   webview "mmd-edit"  → full-document WriteCommandAction on the Document
 *   documentChanged (external edit, text undo, git checkout)
 *                       → "mmd-document" push back into the webview
 *
 * Transport: JS→host via a JBCefJSQuery bound to `window.__mmdHost.postMessage`
 * (injected by WebviewAssets before the app bundle loads); host→JS by
 * calling `window.__mmdHostReceive(<json>)`.
 */
class MmdFileEditor(
    private val project: Project,
    private val file: VirtualFile,
) : UserDataHolderBase(), FileEditor {

    private val gson = Gson()
    private val document: Document =
        requireNotNull(FileDocumentManager.getInstance().getDocument(file)) {
            "Geen document voor ${file.path}"
        }
    private val browser = JBCefBrowser()
    private val query = JBCefJSQuery.create(browser as JBCefBrowserBase)

    /** Text we expect to see in the next change event because we applied it
     *  ourselves; consumed once so a later undo *back to* this text still
     *  reaches the webview. */
    private var expectedEchoText: String? = null

    init {
        Disposer.register(this, browser)
        Disposer.register(this, query)

        query.addHandler { raw ->
            ApplicationManager.getApplication().invokeLater { handleMessage(raw) }
            null
        }

        document.addDocumentListener(object : DocumentListener {
            override fun documentChanged(event: DocumentEvent) {
                val text = document.text
                if (expectedEchoText != null && text == expectedEchoText) {
                    expectedEchoText = null // our own edit — consume, don't echo
                    return
                }
                expectedEchoText = null
                sendDocument()
            }
        }, this)

        browser.loadURL(WebviewAssets.prepareIndexHtml(query).toUri().toString())
    }

    private fun handleMessage(raw: String) {
        val msg = runCatching { gson.fromJson(raw, JsonObject::class.java) }.getOrNull() ?: return
        when (msg.get("type")?.asString) {
            "mmd-ready" -> sendDocument()

            "mmd-edit" -> {
                val text = msg.get("text")?.asString ?: return
                if (text == document.text) return
                expectedEchoText = text
                WriteCommandAction.runWriteCommandAction(project, "MMD Flowchart", null, {
                    document.setText(text)
                })
            }

            "mmd-save" -> FileDocumentManager.getInstance().saveDocument(document)

            "mmd-export" -> {
                val fileName = msg.get("fileName")?.asString ?: return
                val dataUrl = msg.get("dataUrl")?.asString ?: return
                saveExport(fileName, dataUrl)
            }
        }
    }

    private fun sendDocument() {
        val payload = JsonObject().apply {
            addProperty("type", "mmd-document")
            addProperty("fileName", file.name)
            addProperty("text", document.text)
        }
        browser.cefBrowser.executeJavaScript(
            "window.__mmdHostReceive && window.__mmdHostReceive(${gson.toJson(payload)})",
            browser.cefBrowser.url,
            0,
        )
    }

    private fun saveExport(fileName: String, dataUrl: String) {
        val ext = fileName.substringAfterLast('.', "png")
        val descriptor = FileSaverDescriptor("Diagram exporteren", "Kies een locatie", ext)
        val dialog = FileChooserFactory.getInstance().createSaveFileDialog(descriptor, project)
        val target = dialog.save(file.parent, fileName) ?: return
        target.file.writeBytes(decodeDataUrl(dataUrl))
    }

    /** Decode a data URL to bytes. Handles both base64 payloads (toPng)
     *  and percent-encoded UTF-8 payloads (toSvg). */
    private fun decodeDataUrl(dataUrl: String): ByteArray {
        val comma = dataUrl.indexOf(',')
        require(comma != -1) { "Ongeldige data-URL." }
        val header = dataUrl.substring(0, comma)
        val payload = dataUrl.substring(comma + 1)
        return if (header.contains(";base64")) {
            Base64.getDecoder().decode(payload)
        } else {
            URLDecoder.decode(payload, StandardCharsets.UTF_8).toByteArray(StandardCharsets.UTF_8)
        }
    }

    // --- FileEditor boilerplate -------------------------------------------

    override fun getComponent(): JComponent = browser.component
    override fun getPreferredFocusedComponent(): JComponent = browser.component
    override fun getName(): String = "MMD Flowchart"
    override fun setState(state: FileEditorState) {}
    override fun isModified(): Boolean =
        FileDocumentManager.getInstance().isDocumentUnsaved(document)
    override fun isValid(): Boolean = file.isValid
    override fun addPropertyChangeListener(listener: PropertyChangeListener) {}
    override fun removePropertyChangeListener(listener: PropertyChangeListener) {}
    override fun getFile(): VirtualFile = file
    override fun dispose() {}
}
