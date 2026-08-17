plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.novacore.showcase"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.novacore.showcase"
        // Android 8.0 : couvre la très large majorité du parc et permet
        // d'utiliser les icônes adaptatives sans jeu de PNG de repli.
        minSdk = 26
        targetSdk = 36
        versionCode = 2
        versionName = "1.1.0"

        // URL consultée par l'application. Modifiable ici sans toucher au code :
        // elle est exposée au Kotlin via BuildConfig.SITE_URL.
        buildConfigField(
            "String",
            "SITE_URL",
            "\"https://zeptoniator.github.io/immersive-3d-showcase/\""
        )
        // Hôte autorisé à s'ouvrir dans l'application ; tout le reste part vers
        // le navigateur du système.
        buildConfigField("String", "SITE_HOST", "\"zeptoniator.github.io\"")
    }

    buildFeatures {
        buildConfig = true
        viewBinding = true
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Aucune clé de signature n'est versionnée : la variante `release`
            // doit être signée avec votre propre keystore (voir android/README.md).
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.splashscreen)
    implementation(libs.androidx.webkit)
}
