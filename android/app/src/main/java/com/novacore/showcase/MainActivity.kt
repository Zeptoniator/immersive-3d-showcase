package com.novacore.showcase

import android.annotation.SuppressLint
import android.content.Intent
import android.content.res.ColorStateList
import android.content.res.Configuration
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.toDrawable
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.novacore.showcase.databinding.ActivityMainBinding

/**
 * Écran unique de l'application : une WebView plein écran affichant le site
 * NOVA CORE.
 *
 * Trois points méritent attention :
 *
 * 1. **Accélération matérielle** — indispensable pour que WebGL fonctionne. Elle
 *    est déclarée dans le manifeste et jamais désactivée ici.
 * 2. **Navigation** — les liens du site restent dans l'application, tout lien
 *    externe part vers le navigateur du système. L'utilisateur ne peut donc pas
 *    se retrouver « piégé » sur un site tiers sans barre d'adresse.
 * 3. **Hors ligne** — une page blanche serait inacceptable : l'absence de réseau
 *    ou une erreur de chargement affiche un écran dédié avec un bouton Réessayer.
 * 4. **Thème** — l'habillage natif (fond, barres système, écran de démarrage,
 *    écran d'erreur) suit le mode nuit du système, comme le fait le site. Sans
 *    cela, un téléphone en thème clair afficherait un fond sombre pendant tout
 *    le chargement, puis une page claire : un clignotement inverse du problème
 *    que le site résout déjà de son côté.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    /** Vrai tant que le chargement en cours n'a pas produit d'erreur. */
    private var loadSucceeded = true

    /** L'écran de démarrage reste affiché tant que la page n'est pas prête. */
    private var contentReady = false

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        splashScreen.setKeepOnScreenCondition { !contentReady }

        super.onCreate(savedInstanceState)

        // `auto` choisit le contraste des icônes système d'après le mode nuit :
        // icônes sombres sur une page claire, claires sur une page sombre.
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT)
        )

        // Débogage distant de la WebView, variante de débogage uniquement :
        // permet d'inspecter la page depuis chrome://inspect ou via le protocole
        // DevTools. Jamais actif dans une build de production.
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        applyWindowInsets()
        configureWebView()
        applyThemeColors()
        registerBackNavigation()

        binding.retryButton.setOnClickListener { loadSite() }

        if (savedInstanceState != null) {
            binding.webView.restoreState(savedInstanceState)
            contentReady = true
        } else {
            loadSite()
        }
    }

    /**
     * Applique les couleurs du thème courant aux surfaces natives.
     *
     * `configChanges` inclut `uiMode` pour ne pas détruire la WebView — et donc
     * le contexte WebGL — quand le système bascule en mode sombre. En
     * contrepartie, les vues déjà gonflées gardent les couleurs résolues au
     * moment de leur création : il faut les réappliquer nous-mêmes. Cette
     * fonction est donc appelée à la création puis à chaque changement de
     * configuration.
     */
    private fun applyThemeColors() {
        val surface = ContextCompat.getColor(this, R.color.surface)
        val accent = ContextCompat.getColor(this, R.color.accent)

        window.setBackgroundDrawable(surface.toDrawable())
        // Fond repris du thème : plus de flash sombre avant le premier rendu.
        binding.webView.setBackgroundColor(surface)
        binding.errorView.setBackgroundColor(surface)
        binding.progressBar.progressTintList = ColorStateList.valueOf(accent)

        binding.errorTitle.setTextColor(ContextCompat.getColor(this, R.color.text))
        binding.errorMessage.setTextColor(ContextCompat.getColor(this, R.color.text_muted))
        binding.retryButton.backgroundTintList = ColorStateList.valueOf(accent)
        binding.retryButton.setTextColor(ContextCompat.getColor(this, R.color.on_accent))
    }

    /**
     * L'affichage est bord à bord : on reporte les encoches et la barre de
     * navigation en marge de la WebView plutôt que de laisser le contenu passer
     * dessous.
     */
    private fun applyWindowInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            WindowInsetsCompat.CONSUMED
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() = with(binding.webView) {
        settings.apply {
            // Le site est une application React : JavaScript et stockage local
            // sont indispensables (la préférence de qualité y est mémorisée).
            javaScriptEnabled = true
            domStorageEnabled = true

            loadWithOverviewMode = true
            useWideViewPort = true

            // La page gère elle-même son responsive : le zoom natif ferait
            // double emploi et gênerait les gestes de rotation de la scène 3D.
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)

            // Aucun contenu mixte : le site est servi intégralement en HTTPS.
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        /*
         * Fait suivre `prefers-color-scheme` au mode nuit de l'application.
         *
         * Sans cela, la WebView signale toujours un thème clair et le site
         * s'afficherait en clair sur un téléphone en mode sombre. Le site
         * déclarant `color-scheme: dark light`, Android utilise ses styles
         * sombres plutôt que d'inverser les couleurs de force — et un choix
         * explicite fait depuis l'en-tête du site continue de primer.
         */
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, true)
        }

        overScrollMode = View.OVER_SCROLL_NEVER

        webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                binding.progressBar.progress = newProgress
                binding.progressBar.visibility = if (newProgress >= 100) View.GONE else View.VISIBLE
            }
        }

        webViewClient = object : WebViewClient() {

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val url = request.url
                // Le site reste dans l'application, tout le reste s'ouvre à
                // l'extérieur pour que l'origine soit visible par l'utilisateur.
                if (url.host == BuildConfig.SITE_HOST) return false
                openExternally(url)
                return true
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                loadSucceeded = true
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError,
            ) {
                // Seul l'échec du document principal doit basculer sur l'écran
                // d'erreur : une ressource secondaire manquante ne doit pas
                // masquer une page par ailleurs utilisable.
                if (!request.isForMainFrame) return
                loadSucceeded = false
                showError()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                contentReady = true
                if (loadSucceeded) showContent()
            }
        }
    }

    /** Le bouton Retour remonte l'historique de la page avant de quitter. */
    private fun registerBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun loadSite() {
        if (!isOnline()) {
            contentReady = true
            showError(offline = true)
            return
        }
        loadSucceeded = true
        showContent()
        binding.webView.loadUrl(BuildConfig.SITE_URL)
    }

    private fun showContent() {
        binding.errorView.visibility = View.GONE
        binding.webView.visibility = View.VISIBLE
    }

    private fun showError(offline: Boolean = !isOnline()) {
        binding.progressBar.visibility = View.GONE
        binding.webView.visibility = View.GONE
        binding.errorTitle.setText(
            if (offline) R.string.error_offline_title else R.string.error_load_title
        )
        binding.errorMessage.setText(
            if (offline) R.string.error_offline_message else R.string.error_load_message
        )
        binding.errorView.visibility = View.VISIBLE
    }

    private fun isOnline(): Boolean {
        val manager = getSystemService(ConnectivityManager::class.java) ?: return false
        val capabilities = manager.getNetworkCapabilities(manager.activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    private fun openExternally(uri: Uri) {
        runCatching { startActivity(Intent(Intent.ACTION_VIEW, uri)) }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        // Conserve l'historique et la position lors d'une rotation d'écran.
        binding.webView.saveState(outState)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        // `configChanges` dans le manifeste évite de détruire la WebView à la
        // rotation : le contexte WebGL n'est donc jamais perdu.
        super.onConfigurationChanged(newConfig)

        // Bascule clair/sombre du système : les ressources sont déjà résolues
        // pour la nouvelle configuration, il reste à les reposer sur les vues
        // et à recalculer le contraste des icônes système.
        applyThemeColors()
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT)
        )
    }

    override fun onPause() {
        super.onPause()
        // Suspend la boucle de rendu quand l'application passe en arrière-plan.
        binding.webView.onPause()
        binding.webView.pauseTimers()
    }

    override fun onResume() {
        super.onResume()
        binding.webView.resumeTimers()
        binding.webView.onResume()
    }

    override fun onDestroy() {
        // Libération explicite : une WebView non détruite retient son contexte
        // graphique et fuit la mémoire.
        binding.webView.apply {
            stopLoading()
            (parent as? android.view.ViewGroup)?.removeView(this)
            destroy()
        }
        super.onDestroy()
    }
}
