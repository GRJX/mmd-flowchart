package nl.dictu.mmdflowchart

import org.cef.CefApp
import org.cef.callback.CefCallback
import org.cef.handler.CefResourceHandlerAdapter
import org.cef.misc.IntRef
import org.cef.misc.StringRef
import org.cef.network.CefRequest
import org.cef.network.CefResponse
import java.net.URI

/**
 * Serveert de editor-bestanden uit de plugin-jar (`/webview/...`) onder
 * http://mmd-flowchart/. Nodig omdat de browser ES-modules niet via file:// of
 * rechtstreeks uit een jar kan laden.
 */
class WebviewResourceHandler : CefResourceHandlerAdapter() {
    private var data = ByteArray(0)
    private var mimeType = "text/html"
    private var offset = 0

    override fun processRequest(request: CefRequest, callback: CefCallback): Boolean {
        val path = URI(request.url).path.removePrefix("/").ifEmpty { "index.html" }
        if (path.contains("..")) return false
        val stream = javaClass.getResourceAsStream("/webview/$path") ?: return false

        data = stream.use { it.readBytes() }
        mimeType = mimeTypeOf(path)
        callback.Continue()
        return true
    }

    override fun getResponseHeaders(response: CefResponse, responseLength: IntRef, redirectUrl: StringRef) {
        response.status = 200
        response.mimeType = mimeType
        responseLength.set(data.size)
    }

    override fun readResponse(dataOut: ByteArray, bytesToRead: Int, bytesRead: IntRef, callback: CefCallback): Boolean {
        if (offset >= data.size) {
            bytesRead.set(0)
            return false
        }
        val count = minOf(bytesToRead, data.size - offset)
        data.copyInto(dataOut, 0, offset, offset + count)
        offset += count
        bytesRead.set(count)
        return true
    }

    companion object {
        private const val HOST = "mmd-flowchart"
        const val INDEX_URL = "http://$HOST/index.html"

        private var registered = false

        fun register() {
            if (registered) return
            CefApp.getInstance().registerSchemeHandlerFactory("http", HOST) { _, _, _, _ ->
                WebviewResourceHandler()
            }
            registered = true
        }

        private fun mimeTypeOf(path: String): String = when (path.substringAfterLast('.')) {
            "html" -> "text/html"
            "js" -> "text/javascript"
            "css" -> "text/css"
            "svg" -> "image/svg+xml"
            "png" -> "image/png"
            "woff2" -> "font/woff2"
            "woff" -> "font/woff"
            else -> "application/octet-stream"
        }
    }
}
