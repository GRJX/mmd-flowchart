package nl.dictu.mmdflowchart

import com.google.gson.Gson
import com.google.gson.JsonObject
import com.intellij.ide.ui.LafManagerListener
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
import com.intellij.openapi.util.text.StringUtil
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.JBColor
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefJSQuery
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.handler.CefLoadHandlerAdapter
import java.beans.PropertyChangeListener
import java.util.Base64
import javax.swing.JComponent

/**
 * Toont de flowchart-editor (de Vite-build) in een ingebouwde browser en houdt
 * die gelijk met het document van het `.mmd`-bestand. Opslaan doet IntelliJ.
 * De berichten staan beschreven in src/lib/host/host.ts in de root.
 */
class MmdFileEditor(private val project: Project, private val file: VirtualFile) :
    UserDataHolderBase(), FileEditor {

    private val document: Document = FileDocumentManager.getInstance().getDocument(file)!!
    private val browser = JBCefBrowser()
    private val fromEditor = JBCefJSQuery.create(browser as JBCefBrowserBase)
    private val gson = Gson()

    init {
        Disposer.register(this, browser)
        Disposer.register(this, fromEditor)

        fromEditor.addHandler { json ->
            ApplicationManager.getApplication().invokeLater { handleMessage(json) }
            null
        }

        // Na het laden: de functie `window.mmdHost` injecteren en het bestand sturen.
        browser.jbCefClient.addLoadHandler(object : CefLoadHandlerAdapter() {
            override fun onLoadEnd(cefBrowser: CefBrowser, frame: CefFrame, httpStatusCode: Int) {
                if (!frame.isMain) return
                cefBrowser.executeJavaScript(
                    "window.mmdHost = function(json) { ${fromEditor.inject("json")} };",
                    cefBrowser.url, 0,
                )
                sendLoad()
            }
        }, browser.cefBrowser)

        // Wijzigingen buiten de editor (teksteditor, git, undo) doorgeven. De
        // editor negeert tekst die hij zelf al heeft.
        document.addDocumentListener(object : DocumentListener {
            override fun documentChanged(event: DocumentEvent) = sendLoad()
        }, this)
        ApplicationManager.getApplication().messageBus.connect(this)
            .subscribe(LafManagerListener.TOPIC, LafManagerListener { sendLoad() })

        WebviewResourceHandler.register()
        browser.loadURL(WebviewResourceHandler.INDEX_URL)
    }

    private fun sendLoad() {
        val message = mapOf(
            "type" to "load",
            "fileName" to file.name,
            "text" to document.text,
            "theme" to if (JBColor.isBright()) "light" else "dark",
        )
        browser.cefBrowser.executeJavaScript("window.postMessage(${gson.toJson(message)}, '*');", "", 0)
    }

    private fun handleMessage(json: String) {
        val message = gson.fromJson(json, JsonObject::class.java)
        when (message.get("type").asString) {
            "ready" -> sendLoad()
            "change" -> replaceText(message.get("text").asString)
            "export" -> exportImage(message.get("fileName").asString, message.get("base64").asString)
        }
    }

    private fun replaceText(text: String) {
        val normalized = StringUtil.convertLineSeparators(text)
        if (document.text == normalized) return
        WriteCommandAction.runWriteCommandAction(project, "Flowchart bewerken", null, {
            document.setText(normalized)
        })
    }

    private fun exportImage(fileName: String, base64: String) {
        val extension = fileName.substringAfterLast('.')
        val descriptor = FileSaverDescriptor("Exporteren", "Diagram exporteren als $extension", extension)
        val target = FileChooserFactory.getInstance()
            .createSaveFileDialog(descriptor, project)
            .save(file.parent, fileName) ?: return
        target.file.writeBytes(Base64.getDecoder().decode(base64))
    }

    override fun getComponent(): JComponent = browser.component

    override fun getPreferredFocusedComponent(): JComponent = browser.component

    override fun getName(): String = "MMD Flowchart"

    override fun getFile(): VirtualFile = file

    override fun setState(state: FileEditorState) {}

    override fun isModified(): Boolean = false

    override fun isValid(): Boolean = file.isValid

    override fun addPropertyChangeListener(listener: PropertyChangeListener) {}

    override fun removePropertyChangeListener(listener: PropertyChangeListener) {}

    override fun dispose() {}
}
