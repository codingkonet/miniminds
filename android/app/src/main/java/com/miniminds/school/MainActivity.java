package com.miniminds.school;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.util.Locale;

public class MainActivity extends Activity {
    // Online-first: the app loads the live site, so web updates sync without a new APK.
    // If offline / site unreachable, it falls back to the bundled copy inside the APK.
    static final String ONLINE_URL = "https://codingkonet.github.io/miniminds/#/app";
    static final String OFFLINE_URL = "file:///android_asset/www/index.html#/app";
    private boolean loadedOffline = false;
    private WebView webView;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String pendingText;
    private String pendingLang;

    public class TtsBridge {
        @JavascriptInterface
        public void speak(String text, String lang) {
            runOnUiThread(() -> speakNow(text, lang));
        }
        @JavascriptInterface
        public void stop() {
            if (tts != null) tts.stop();
        }
    }

    private void speakNow(String text, String lang) {
        if (tts == null || !ttsReady) { pendingText = text; pendingLang = lang; return; }
        Locale locale = "fr".equals(lang) ? Locale.FRENCH : Locale.US;
        tts.setLanguage(locale);
        tts.setSpeechRate(0.85f);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "miniminds");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        tts = new TextToSpeech(this, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady && pendingText != null) { speakNow(pendingText, pendingLang); pendingText = null; }
        });
        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        webView.addJavascriptInterface(new TtsBridge(), "AndroidTTS");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame() && !loadedOffline) {
                    loadedOffline = true;
                    view.loadUrl(OFFLINE_URL);
                }
            }
            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, android.webkit.WebResourceResponse response) {
                if (request.isForMainFrame() && !loadedOffline && response.getStatusCode() >= 400) {
                    loadedOffline = true;
                    view.loadUrl(OFFLINE_URL);
                }
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);
        webView.loadUrl(ONLINE_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
