package com.novacore.showcase

import android.annotation.SuppressLint
import android.content.Intent
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
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
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

        // Le site est intégralement sombre : les barres système suivent.
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT)
        )

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        applyWindowInsets()
        configureWebView()
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

        setBackgroundColor(Color.parseColor("#04060E"))
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
