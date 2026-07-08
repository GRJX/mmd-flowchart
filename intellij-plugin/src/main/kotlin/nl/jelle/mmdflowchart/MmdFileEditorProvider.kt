package nl.jelle.mmdflowchart

import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorPolicy
import com.intellij.openapi.fileEditor.FileEditorProvider
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.jcef.JBCefApp

/**
 * Registers the visual editor as an *additional* editor tab for `.mmd`
 * files (next to the default text editor) — the IntelliJ analog of the
 * VSCode custom editor with `priority: "option"`: plain text stays the
 * default, diffs stay text, and other Mermaid plugins are unaffected.
 */
class MmdFileEditorProvider : FileEditorProvider, DumbAware {

    override fun accept(project: Project, file: VirtualFile): Boolean =
        "mmd".equals(file.extension, ignoreCase = true) && JBCefApp.isSupported()

    override fun createEditor(project: Project, file: VirtualFile): FileEditor =
        MmdFileEditor(project, file)

    override fun getEditorTypeId(): String = "mmd-flowchart-editor"

    override fun getPolicy(): FileEditorPolicy = FileEditorPolicy.PLACE_AFTER_DEFAULT_EDITOR
}
