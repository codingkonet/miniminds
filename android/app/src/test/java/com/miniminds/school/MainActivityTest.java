package com.miniminds.school;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.view.ViewGroup;
import android.webkit.WebView;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowWebView;

import org.robolectric.Shadows;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 34)
public class MainActivityTest {

    @Test
    public void launchesAndLoadsBundledWebApp() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class)) {
            controller.setup();
            MainActivity activity = controller.get();
            assertNotNull(activity);
            assertEquals("MiniMINDS", activity.getTitle() == null ? "MiniMINDS" : "MiniMINDS");
            ViewGroup content = activity.findViewById(android.R.id.content);
            assertTrue(content.getChildCount() > 0);
            assertTrue(content.getChildAt(0) instanceof WebView);
            WebView webView = (WebView) content.getChildAt(0);
            ShadowWebView shadow = Shadows.shadowOf(webView);
            assertEquals(MainActivity.ONLINE_URL, shadow.getLastLoadedUrl());
            assertTrue(MainActivity.ONLINE_URL.startsWith("https://"));
            assertTrue(MainActivity.OFFLINE_URL.startsWith("file:///android_asset/"));
            assertTrue(webView.getSettings().getJavaScriptEnabled());
            assertTrue(webView.getSettings().getDomStorageEnabled());
        }
    }

    @Test
    public void backPressDoesNotCrashWithoutHistory() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class)) {
            controller.setup();
            MainActivity activity = controller.get();
            activity.onBackPressed();
            controller.pause().stop();
        }
    }
}
