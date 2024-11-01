<?php
/**
 * Plugin Name: Squeeze
 * Description: Compress unlimited images directly into your browser.
 * Author URI:  https://bogdan.kyiv.ua
 * Author:      Bogdan Bendziukov
 * Version:     1.4.6
 *
 * Text Domain: squeeze
 * Domain Path: /languages
 *
 * License:     GNU GPL v3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * Network:     false
 * 
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
	exit;
}

define('SQUEEZE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SQUEEZE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SQUEEZE_PLUGIN_VERSION', '1.4.6');
define('SQUEEZE_ALLOWED_IMAGE_MIME_TYPES', array(
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
));
define('SQUEEZE_ALLOWED_IMAGE_FORMATS', 'jpg,jpeg,png,webp,avif');

add_action('plugins_loaded', 'squeeze_load_textdomain');
/**
 * Load plugin textdomain
 */
function squeeze_load_textdomain() {
	load_plugin_textdomain('squeeze', false, dirname(plugin_basename(__FILE__)) . '/languages/');
}

include_once(SQUEEZE_PLUGIN_DIR . 'src/settings.php');
include_once(SQUEEZE_PLUGIN_DIR . 'src/handlers.php');


add_action('admin_print_footer_scripts', 'squeeze_block_assets');
/**
 * Enqueue assets
 */
function squeeze_block_assets() {
	global $pagenow;

	$options = get_option( 'squeeze_options' );
	$default_options = squeeze_get_default_value( null, true); // get all default values
	$js_options = array();

	foreach ($default_options as $key => $value) {
		if (isset($options[$key])) {
			if (is_numeric($options[$key])) {
				$js_options[$key] = intval($options[$key]);
			} elseif ($options[$key] === "on") {
				$js_options[$key] = true;
			} elseif ($key === "compress_thumbs") {
				$js_options[$key] = $options[$key];
			} 
		} else {
			$js_options[$key] = $value;
		}
	}

	if (!wp_script_is('media-editor', 'enqueued')) {
	    wp_enqueue_media();
	}

	// Enqueue script for backend.

	wp_enqueue_script(
		'squeeze-script',
		// Handle.
		plugins_url('/assets/js/script.bundle.js', __FILE__),
		array('jquery', 'wp-mediaelement'),
		// Dependencies, defined above.
		SQUEEZE_PLUGIN_VERSION,
		true // Enqueue the script in the footer.
	);


	// WP Localized globals. Use dynamic PHP stuff in JavaScript via `squeeze` object.
	wp_localize_script(
		'squeeze-script',
		'squeezeOptions',
		// Array containing dynamic data for a JS Global.
		[
			'pluginUrl' => SQUEEZE_PLUGIN_URL,
			'ajaxUrl' => admin_url('admin-ajax.php'),
			'nonce' => wp_create_nonce('squeeze-nonce'),
			'options' => wp_json_encode($js_options),
		]
	);

	wp_set_script_translations('squeeze-script', 'squeeze', plugin_dir_path(__DIR__) . 'languages');

}


