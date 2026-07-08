package nl.jelle.mmdflowchart

import com.intellij.ui.jcef.JBCefJSQuery
import java.nio.file.Files
import java.nio.file.Path

/**
 * Generates the HTML page JCEF loads, using the shared webview bundle
 * (built by Vite into vscode-extension/media/webview/ and copied into
 * plugin resources as /webview by processResources).
 *
 * The JS and CSS are **inlined** into the HTML instead of referenced as
 * files: the page is loaded over `file://`, and Chromium blocks external
 * `<script type="module">` fetches from file:// origins (opaque origin →
 * CORS failure), which would leave the canvas blank. Inline scripts don't
 * fetch anything, so they run fine.
 *
 * The HTML is generated per editor instance because the `window.__mmdHost`
 * bootstrap embeds the JBCefJSQuery injection snippet, which is unique per
 * query. The bootstrap must run *before* the app bundle so the bridge's
 * transport detection (src/lib/host/bridge.ts) sees `__mmdHost` on init.
 */
object WebviewAssets {

    /** Fixed names thanks to vite.vscode.config.ts (no content hashes). */
    private fun resourceText(name: String): String =
        javaClass.getResourceAsStream("/webview/$name")?.use {
            it.readBytes().toString(Charsets.UTF_8)
        } ?: error(
            "Webview-asset ontbreekt in de plugin: $name. " +
                "Draai eerst `npm run build:webview` in de repo-root en herbouw de plugin.",
        )

    fun prepareIndexHtml(query: JBCefJSQuery): Path {
        // Guard against premature tag termination when embedding: "<\/" is
        // an identical escape for "/" inside JS strings and regexes.
        val js = resourceText("assets/index.js").replace("</script", "<\\/script")
        val css = resourceText("assets/index.css").replace("</style", "")

        // JBCefJSQuery.inject returns the JS snippet that forwards its
        // argument (a JS expression, here the variable `payload`) to the
        // Kotlin handler registered on the query.
        val postSnippet = query.inject("payload")

        val html = buildString {
            append("<!doctype html>\n<html lang=\"nl\">\n<head>\n")
            append("<meta charset=\"UTF-8\" />\n")
            append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n")
            append("<title>MMD Flowchart</title>\n")
            append("<script>\n")
            append("window.__mmdHost = { postMessage: function (payload) { ")
            append(postSnippet)
            append(" } };\n")
            append("</script>\n")
            append("<style>html, body, #root { height: 100%; margin: 0; }</style>\n")
            append("<style>\n").append(css).append("\n</style>\n")
            append("</head>\n<body>\n<div id=\"root\"></div>\n")
            append("<script type=\"module\">\n").append(js).append("\n</script>\n")
            append("</body>\n</html>\n")
        }

        val htmlFile = Files.createTempFile("mmd-flowchart-", ".html")
        Files.writeString(htmlFile, html)
        htmlFile.toFile().deleteOnExit()
        return htmlFile
    }
}
