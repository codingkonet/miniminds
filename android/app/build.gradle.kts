plugins {
    id("com.android.application")
}

android {
    namespace = "com.miniminds.myapp"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.miniminds.myapp"
        minSdk = 26
        targetSdk = 36
        versionCode = 10
        versionName = "1.0.9"
    }

    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: (System.getProperty("user.home") + "/android-toolchain/miniminds-release.keystore"))
            storePassword = System.getenv("KEYSTORE_PASS")
            keyAlias = "miniminds"
            keyPassword = System.getenv("KEY_PASS")
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.11.1")
}
