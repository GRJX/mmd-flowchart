package nl.dictu.mmdflowchart

import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorPolicy
import com.intellij.openapi.fileEditor.FileEditorProvider
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.jcef.JBCefApp

/** Voegt een "MMD Flowchart"-tab toe naast de teksteditor van `.mmd`-bestanden. */
class MmdFileEditorProvider : FileEditorProvider, DumbAware {
    override fun accept(project: Project, file: VirtualFile): Boolean =
        file.extension.equals("mmd", ignoreCase = true) && JBCefApp.isSupported()

    override fun createEditor(project: Project, file: VirtualFile): FileEditor = MmdFileEditor(project, file)

    override fun getEditorTypeId(): String = "mmd-flowchart"

    override fun getPolicy(): FileEditorPolicy = FileEditorPolicy.PLACE_AFTER_DEFAULT_EDITOR
}
