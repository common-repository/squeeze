<?php
// Exit if accessed directly.
if (!defined('ABSPATH')) {
	exit;
}

add_action('admin_menu', 'squeeze_options_page');
/**
 * Add submenu page with settings under Media
 */
function squeeze_options_page() {
	add_submenu_page(
		'upload.php',
		__('Squeeze', 'squeeze'),
		__('Squeeze Settings', 'squeeze'),
		'manage_options',
		'squeeze',
		'squeeze_options_page_html'
	);
}

add_action('admin_menu', 'squeeze_options_bulk_page');
/**
 * Add submenu page with bulk compression under Media
 */
function squeeze_options_bulk_page() {
	add_submenu_page(
		'upload.php',
		__('Bulk Compress With Squeeze', 'squeeze'),
		__('Squeeze Bulk', 'squeeze'),
		'manage_options',
		'squeeze-bulk',
		'squeeze_options_bulk_page_html'
	);
}

/**
 * Bulk compression page callback function
 */
function squeeze_options_bulk_page_html() {
    // check user capabilities
	if (!current_user_can('manage_options')) {
		return;
	}
    $mimes = SQUEEZE_ALLOWED_IMAGE_MIME_TYPES;
    $query_not_compressed = new WP_Query( array( 
        'post_type' => 'attachment', 
        'post_status' => 'inherit', 
        'post_mime_type' => $mimes,
        'posts_per_page' => -1,
        'fields' => 'ids',
        'meta_query' => array(
            'relation' => 'OR',
            array(
                'key' => 'squeeze_is_compressed',
                'compare' => 'NOT EXISTS'
            ),
            array(
                'key' => 'squeeze_is_compressed',
                'compare' => '!=',
                'value' => '1'
            )
        ) 
    ) );
    $query_all = new WP_Query( array( 
        'post_type' => 'attachment', 
        'post_status' => 'inherit', 
        'post_mime_type' => $mimes,
        'posts_per_page' => -1,
        'fields' => 'ids',
    ) );
    $uncompressed_count = $query_not_compressed->found_posts;
    $total_count = $query_all->found_posts;
    //$total_count = array_sum((array)wp_count_attachments("image"));

    $not_compressed_posts = implode(",", $query_not_compressed->posts);
    $all_posts = implode(",", $query_all->posts);
	?>
    <style>
        #squeeze_bulk_log {
            height: 300px;
            overflow: auto;
            border: 1px solid #ddd;
            padding: 10px;
            background: #f9f9f9;
            font-family: monospace;
        }
    </style>
	<div class="wrap">
		<h1>
			<?php echo esc_html(get_admin_page_title()); ?>
		</h1>
        <p><?php esc_html_e('This page allows you to compress all images in your media library.', 'squeeze'); ?></p>
        <p><strong><?php esc_html_e('Do not close this page during the compressing process.', 'squeeze'); ?></strong></p>
        <p><?php esc_html_e('Please note that this process may take a long time depending on the number of images in your library.', 'squeeze'); ?></p>

        <?php if ($uncompressed_count === 0) { ?>
            <p><strong><?php esc_html_e('All images in your media library are compressed.', 'squeeze'); ?></strong></p>
        <?php } else { ?>
            <?php /* translators: %1$d is replaced with number of uncompressed images, %2$d is replaced with number of compressed images */ ?>
            <p><?php echo sprintf(wp_kses_data('You have <strong>%1$d</strong> uncompressed images from a total of <strong>%2$d</strong> supported images in your media library.', 'squeeze'), esc_attr($uncompressed_count), esc_attr($total_count)); ?></p>
            <p><?php esc_html_e('Supported image types: JPEG, PNG, WEBP, AVIF.', 'squeeze'); ?></p>
        <?php } ?>
        <p>
            <input name="squeeze_bulk" class="button button-primary" type="button" value="<?php esc_attr_e( 'Optimise uncompressed images' ); ?>" <?php echo $uncompressed_count === 0 ? 'hidden disabled' : ''; ?> />
            <input name="squeeze_bulk_again" class="button button-secondary" type="button" value="<?php esc_attr_e( 'Re-Optimise all images' ); ?>" />
        </p>
        <p>
        <label>
            <?php esc_html_e('Optimise images from custom path', 'squeeze'); ?>:<br>
            <strong><?php esc_html_e('WARNING! Backup option is NOT applicable here, please backup your images manually before optimising them.', 'squeeze'); ?></strong><br>
            <input type="text" name="squeeze_bulk_path" value="<?php esc_html_e('/wp-content/uploads/', 'squeeze'); ?>" placeholder="<?php esc_html_e('/wp-content/uploads/', 'squeeze'); ?>" />
            <input type="button" name="squeeze_bulk_path_button" class="button button-secondary" value="<?php esc_html_e('Optimise images from custom path', 'squeeze'); ?>" />
        </label>
        </p>

        <input type="hidden" value="<?php echo wp_kses_data($not_compressed_posts); ?>" name="squeeze_bulk_ids" />
        <input type="hidden" value="<?php echo wp_kses_data($all_posts); ?>" name="squeeze_bulk_all_ids" /><?php // TBD: split into chunks for better performance ?>
        <p><div name="squeeze_bulk_log" id="squeeze_bulk_log" contenteditable="false"></div></p>
        
	</div>
    <?php
}

/**
 * Options page callback function
 */
function squeeze_options_page_html() {
	// check user capabilities
	if (!current_user_can('manage_options')) {
		return;
	}
	?>
	<div class="wrap">
		<h1>
			<?php echo esc_html(get_admin_page_title()); ?>
		</h1>
        <nav class="nav-tab-wrapper">
            <a href="#squeeze_basic" class="nav-tab nav-tab-active"><?php esc_html_e('Basic Settings', 'squeeze'); ?></a>
            <a href="#squeeze_jpeg" class="nav-tab"><?php esc_html_e('JPEG Settings', 'squeeze'); ?></a>
            <a href="#squeeze_png" class="nav-tab"><?php esc_html_e('PNG Settings', 'squeeze'); ?></a>
            <a href="#squeeze_webp" class="nav-tab"><?php esc_html_e('WEBP Settings', 'squeeze'); ?></a>
            <a href="#squeeze_avif" class="nav-tab"><?php esc_html_e('AVIF Settings', 'squeeze'); ?></a>
        </nav>
        <div class="tab-content">
            <form action="options.php" method="post">
                <?php
                settings_errors( 'squeeze_notices' ); 
                settings_fields( 'squeeze_options' );
                do_settings_sections( 'squeeze_options' );
                ?>
                <?php submit_button(); ?>
                <!--<input name="submit" class="button button-primary" type="submit" value="<?php esc_attr_e( 'Save' ); ?>" />-->
                <input name="restore" class="button button-secondary" type="button" value="<?php esc_attr_e( 'Restore defaults' ); ?>" />
            </form>
        </div>
	</div>
    <script>
        (function() {
            const restore = document.querySelector("input[name='restore']")
            /**
             * Handle restore defaults button click
             */
            restore.addEventListener("click", (event) => {
                jQuery.ajax({
                    url: squeeze.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'squeeze_restore_defaults',
                        _ajax_nonce: squeeze.nonce
                    },
                    beforeSend: function () {
                        restore.disabled = true
                    },
                    error: function (error) {
                        console.error(error)
                    },
                    success: function (response) {
                        console.log(response)
                        let url = new URL(window.location.href);
                        if (response.success) {
                            url.searchParams.append('restore_defaults', true)
                        } else {
                            restore.disabled = false
                            url.searchParams.append('restore_defaults', false)
                        }
                        window.location.replace(url.href)
                    }
                })
            })

            /**
             * jQuery tabs
             * https://gist.github.com/wesamly/03491ebf53e17c75480b8d2de1bf230c 
             */
            let tabs;
            /**
             * Get Tab Key
             */
            function getTabKey(href) {
                return href.replace('#', '');
            }
            /**
             * Hide all tabs
             */
            function hideAllTabs() {
                tabs.each(function(){
                    var href = getTabKey(jQuery(this).attr('href'));
                    jQuery('#' + href).hide();
                });
            }
            /**
             * Activate Tab
             */
            function activateTab(tab) {
                let href = getTabKey(tab.attr('href'));
                tabs.removeClass('nav-tab-active');
                tab.addClass('nav-tab-active');
                jQuery('#' + href).show();
                window.history.pushState({tab: href}, tab.text(), `#${href}`);
            }
            window.onpopstate = history.onpushstate = function (e) {
                const tab = e.state.tab;
                if (tab) {
                    hideAllTabs();
                    activateTab(jQuery(`a[href="#${tab}"]`));
                }
            };
            jQuery(document).ready(function($){
                let activeTab, firstTab;
                // First load, activate first tab or tab with nav-tab-active class
                firstTab = false;
                activeTab = false;
                tabs = $('a.nav-tab');
                let hash = window.location.hash;
                hideAllTabs();
                tabs.each(function(){
                    let href = $(this).attr('href').replace('#', '');
                    if (!firstTab) {
                        firstTab = $(this);
                    }
                    if ($(this).hasClass('nav-tab-active')) {
                        activeTab = $(this);
                    }
                });
                if (hash) {
                    activeTab = $('a[href="' + hash + '"]');
                }
                if (!activeTab || !activeTab.length) {
                    activeTab = firstTab;
                }
                activateTab(activeTab);

                //Click tab
                tabs.click(function(e) {
                    e.preventDefault();
                    hideAllTabs();
                    activateTab($(this));
                });
            });

        })()
    </script>
	<?php
}

add_action( 'admin_init', 'squeeze_register_settings' );
/**
 * Register the settings and add the sections and fields
 */
function squeeze_register_settings() {
    register_setting( 'squeeze_options', 'squeeze_options', 'squeeze_options_validate' );

    add_settings_section( 'squeeze_basic_settings', __('Basic Settings', 'squeeze'), 'squeeze_setting_basic_desc', 'squeeze_options', array( 'before_section' => '<div id="%s">', 'after_section' => '</div>', 'section_class' => 'squeeze_basic' ) );
    
    add_settings_field( 'squeeze_setting_auto_compress', __('Auto compress', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_basic_settings', array( 'label_for' => 'auto_compress', 'class' => 'squeeze_setting_auto_compress', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_backup_original', __('Backup original image', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_basic_settings', array( 'label_for' => 'backup_original', 'class' => 'squeeze_setting_backup_original', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_compress_thumbs', __('Compress thumbnails', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_basic_settings', array( 'label_for' => 'compress_thumbs', 'class' => 'squeeze_setting_compress_thumbs', 'type' => 'thumbs_checkbox_group' ) );
    add_settings_field( 'squeeze_settint_timeout', __('Compression timeout (in seconds)', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_basic_settings', array( 'label_for' => 'timeout', 'class' => 'squeeze_setting_timeout', 'type' => 'number' ) );
   
    add_settings_section( 'squeeze_jpeg_settings', __('JPEG Settings', 'squeeze'), 'squeeze_setting_jpeg_desc', 'squeeze_options', array( 'before_section' => '<div id="%s">', 'after_section' => '</div>', 'section_class' => 'squeeze_jpeg' ) );
    
	add_settings_field( 'squeeze_setting_jpeg_quality', __('Quality', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_quality', 'class' => 'squeeze_setting_jpeg_quality', 'type' => 'range' ) );
	add_settings_field( 'squeeze_setting_jpeg_baseline', __('Pointless spec compliance', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_baseline', 'class' => 'squeeze_setting_jpeg_baseline', 'type' => 'checkbox' ) );
	add_settings_field( 'squeeze_setting_jpeg_arithmetic', __('Arithmetic', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_arithmetic', 'class' => 'squeeze_setting_jpeg_arithmetic', 'type' => 'checkbox' ) );
	add_settings_field( 'squeeze_setting_jpeg_progressive', __('Progressive rendering', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_progressive', 'class' => 'squeeze_setting_jpeg_progressive', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_jpeg_optimize_coding', __('Optimize Huffman table', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_optimize_coding', 'class' => 'squeeze_setting_jpeg_optimize_coding', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_jpeg_smoothing', __('Smoothing', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_smoothing', 'class' => 'squeeze_setting_jpeg_smoothing', 'type' => 'range' ) );
	add_settings_field( 'squeeze_setting_jpeg_color_space', __('Channels', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_color_space', 'class' => 'squeeze_setting_jpeg_color_space', 'type' => 'select', 'options' => array( '3' => 'YCbCr', '1' => 'Grayscale', '2' => 'RGB' ) ) );
    add_settings_field( 'squeeze_setting_jpeg_quant_table', __('Quantization', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_quant_table', 'class' => 'squeeze_setting_jpeg_quant_table', 'type' => 'select', 'options' => array( 
        '0' => 'JPEG Annex K', 
        '1' => 'Flat',
        '2' => 'MSSIM-tuned Kodak', 
        '3' => 'ImageMagick', 
        '4' => 'PSNR-HVS-M-tuned Kodak', 
        '5' => 'Klein et al', 
        '6' => 'Watson et al' ,
        '7' => 'Ahumada et al' ,
        '8' => 'Peterson et al' ,
        ) ) );
    add_settings_field( 'squeeze_setting_jpeg_trellis_multipass', __('Trellis multipass', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_trellis_multipass', 'class' => 'squeeze_setting_jpeg_trellis_multipass', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_jpeg_trellis_opt_zero', __('Optimize zero block runs', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_trellis_opt_zero', 'class' => 'squeeze_setting_jpeg_trellis_opt_zero', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_jpeg_trellis_opt_table', __('Optimize after trellis quantization', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_trellis_opt_table', 'class' => 'squeeze_setting_jpeg_trellis_opt_table', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_jpeg_trellis_loops', __('Trellis quantization passes', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_trellis_loops', 'class' => 'squeeze_setting_jpeg_trellis_loops', 'type' => 'range', 'min' => 1, 'max' => 50 ) );
	add_settings_field( 'squeeze_setting_jpeg_auto_subsample', __('Auto subsample chroma', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_auto_subsample', 'class' => 'squeeze_setting_jpeg_auto_subsample', 'type' => 'checkbox' ) );
	add_settings_field( 'squeeze_setting_jpeg_chroma_subsample', __('Subsample chroma by', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_chroma_subsample', 'class' => 'squeeze_setting_jpeg_chroma_subsample', 'type' => 'range', 'min' => 1, 'max' => 4 ) );
	add_settings_field( 'squeeze_setting_jpeg_separate_chroma_quality', __('Separate chroma quality', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_separate_chroma_quality', 'class' => 'squeeze_setting_jpeg_separate_chroma_quality', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_jpeg_chroma_quality', __('Chroma quality', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_jpeg_settings', array( 'label_for' => 'jpeg_chroma_quality', 'class' => 'squeeze_setting_jpeg_chroma_quality', 'type' => 'range', ) );

    add_settings_section( 'squeeze_png_settings', __('PNG Settings', 'squeeze'), 'squeeze_setting_png_desc', 'squeeze_options', array( 'before_section' => '<div id="%s">', 'after_section' => '</div>', 'section_class' => 'squeeze_png' ) );
    
    add_settings_field( 'squeeze_setting_png_level', __('Effort', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_png_settings', array( 'label_for' => 'png_level', 'class' => 'squeeze_setting_png_level', 'type' => 'range', 'min' => 0, 'max' => 3 ) );
    add_settings_field( 'squeeze_setting_png_interlace', __('Interlace', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_png_settings', array( 'label_for' => 'png_interlace', 'class' => 'squeeze_setting_png_interlace', 'type' => 'checkbox' ) );

    add_settings_section( 'squeeze_webp_settings', __('WEBP Settings', 'squeeze'), 'squeeze_setting_webp_desc', 'squeeze_options', array( 'before_section' => '<div id="%s">', 'after_section' => '</div>', 'section_class' => 'squeeze_webp' ) );

    add_settings_field( 'squeeze_setting_webp_method', __('Effort', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_webp_settings', array( 'label_for' => 'webp_method', 'class' => 'squeeze_setting_webp_method', 'type' => 'range', 'min' => 0, 'max' => 6 ) );
    add_settings_field( 'squeeze_setting_webp_quality', __('Quality', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_webp_settings', array( 'label_for' => 'webp_quality', 'class' => 'squeeze_setting_webp_quality', 'type' => 'range', 'min' => 0, 'max' => 100 ) );
    add_settings_field( 'squeeze_setting_webp_lossless', __('Lossless', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_webp_settings', array( 'label_for' => 'webp_lossless', 'class' => 'squeeze_setting_webp_lossless', 'type' => 'checkbox' ) );
    add_settings_field( 'squeeze_setting_webp_near_lossless', __('Near lossless', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_webp_settings', array( 'label_for' => 'webp_near_lossless', 'class' => 'squeeze_setting_webp_near_lossless', 'type' => 'range', 'min' => 0, 'max' => 100 ) );

    add_settings_section( 'squeeze_avif_settings', __('AVIF Settings', 'squeeze'), 'squeeze_setting_avif_desc', 'squeeze_options', array( 'before_section' => '<div id="%s">', 'after_section' => '</div>', 'section_class' => 'squeeze_avif' ) );

    add_settings_field( 'squeeze_setting_avif_cqLevel', __('Quality', 'squeeze'), 'squeeze_options_callback', 'squeeze_options', 'squeeze_avif_settings', array( 'label_for' => 'avif_cqLevel', 'class' => 'squeeze_setting_avif_cqLevel', 'type' => 'range', 'min' => 1, 'max' => 100 ) );
    
}

/**
 * Sanitize and validate input. Accepts an array, return a sanitized array.
 * @param array $input
 */
function squeeze_options_validate( $input ) {
    $input['jpeg_quality'] =  absint($input['jpeg_quality']);
    $input['jpeg_smoothing'] =  absint($input['jpeg_smoothing']);
    $input['jpeg_color_space'] =  absint($input['jpeg_color_space']);
    $input['jpeg_quant_table'] =  absint($input['jpeg_quant_table']);
    $input['jpeg_trellis_loops'] =  absint($input['jpeg_trellis_loops']);
    $input['jpeg_chroma_subsample'] =  absint($input['jpeg_chroma_subsample']);
    $input['jpeg_chroma_quality'] =  absint($input['jpeg_chroma_quality']);
    $input['png_level'] =  absint($input['png_level']);
    $input['webp_method'] =  absint($input['webp_method']);
    $input['webp_quality'] =  absint($input['webp_quality']);
    $input['webp_near_lossless'] =  absint($input['webp_near_lossless']);
    $input['avif_cqLevel'] =  absint($input['avif_cqLevel']);

    $input['jpeg_baseline'] = isset( $input['jpeg_baseline'] ) ? $input['jpeg_baseline'] : '0';
    $input['jpeg_arithmetic'] = isset( $input['jpeg_arithmetic'] ) ? $input['jpeg_arithmetic'] : '0';
    $input['jpeg_progressive'] = isset( $input['jpeg_progressive'] ) ? $input['jpeg_progressive'] : '0';
    $input['jpeg_optimize_coding'] = isset( $input['jpeg_optimize_coding'] ) ? $input['jpeg_optimize_coding'] : '0';
    $input['jpeg_trellis_multipass'] = isset( $input['jpeg_trellis_multipass'] ) ? $input['jpeg_trellis_multipass'] : '0';
    $input['jpeg_trellis_opt_zero'] = isset( $input['jpeg_trellis_opt_zero'] ) ? $input['jpeg_trellis_opt_zero'] : '0';
    $input['jpeg_trellis_opt_table'] = isset( $input['jpeg_trellis_opt_table'] ) ? $input['jpeg_trellis_opt_table'] : '0';
    $input['jpeg_auto_subsample'] = isset( $input['jpeg_auto_subsample'] ) ? $input['jpeg_auto_subsample'] : '0';
    $input['jpeg_separate_chroma_quality'] = isset( $input['jpeg_separate_chroma_quality'] ) ? $input['jpeg_separate_chroma_quality'] : '0';
    $input['png_interlace'] = isset( $input['png_interlace'] ) ? $input['png_interlace'] : '0';
    $input['webp_lossless'] = isset( $input['webp_lossless'] ) ? $input['webp_lossless'] : '0';
    $input['auto_compress'] = isset( $input['auto_compress'] ) ? $input['auto_compress'] : '0';
    $input['backup_original'] = isset( $input['backup_original'] ) ? $input['backup_original'] : '0';
    $input['compress_thumbs'] = isset( $input['compress_thumbs'] ) ? $input['compress_thumbs'] : array();

    add_settings_error( 'squeeze_notices', 'settings_updated', __( 'Settings have been updated.', 'squeeze' ), 'success' );

    return $input;
}

/**
 * Display and fill the form field
 * @param array $args
 */
function squeeze_options_callback( $args ) {
    $label_for = $args['label_for'];
    $class = $args['class'];
    $type = $args['type'];
    $default = squeeze_get_default_value($label_for);
    $options = get_option( 'squeeze_options' );

    switch ($type) {
        case 'text':
            $value = isset($options[$label_for]) ? $options[$label_for] : $default;
            echo "<input id='squeeze_setting_".esc_attr($label_for)."' name='squeeze_options[".esc_attr($label_for)."]' type='text' value='" . esc_attr( $value ) . "' />";
            break;
        case 'number':
            $value = isset($options[$label_for]) ? $options[$label_for] : $default;
            echo "<input id='squeeze_setting_".esc_attr($label_for)."' name='squeeze_options[".esc_attr($label_for)."]' type='number' value='" . esc_attr( $value ) . "' />";
            break;
        case 'range':
            $value = isset($options[$label_for]) ? $options[$label_for] : $default;
            $min = isset($args['min']) ? $args['min'] : 0;
            $max = isset($args['max']) ? $args['max'] : 100;
            $step = isset($args['step']) ? $args['step'] : 1;
            echo "<input id='squeeze_setting_".esc_attr($label_for)."' name='squeeze_options[".esc_attr($label_for)."]' min='".(int)$min."' max='".(int)$max."' step='".(int)$step."' type='range' value='" . esc_attr( $value ) . "' />";
            echo '<output id="squeeze_setting_'.esc_attr($label_for).'_value"></output>';
            ?>
            <script>
                (function () {
                    const value = document.querySelector("#squeeze_setting_<?php echo esc_attr($label_for); ?>_value")
                    const input = document.querySelector("#squeeze_setting_<?php echo esc_attr($label_for); ?>")
                    value.textContent = input.value
                    input.addEventListener("input", (event) => {
                        value.textContent = event.target.value
                    })
                })()
            </script>
            <?php
            break;
        case 'checkbox':
            $value = isset($options[$label_for]) ? (bool) $options[$label_for] : $default;
            echo "<input id='squeeze_setting_".esc_attr($label_for)."' name='squeeze_options[".esc_attr($label_for)."]' type='checkbox' ".checked( $value, true, false )." />";
            break;
        case 'select':
            $value = isset($options[$label_for]) ? $options[$label_for] : $default;
            echo "<select id='squeeze_setting_".esc_attr($label_for)."' name='squeeze_options[".esc_attr($label_for)."]'>";
            foreach ($args['options'] as $key => $option) {
                echo "<option value='".esc_attr($key)."' ".selected( $value, $key, false ).">".esc_html($option)."</option>";
            }
            echo "</select>";
            break;
        case 'thumbs_checkbox_group':
            $thumbs = array();
            $value = isset($options[$label_for]) ? (array) $options[$label_for] : $default;
            $available_sizes = wp_get_registered_image_subsizes();
            foreach ($available_sizes as $key => $size) {
                $thumbs[$key] = ucwords(str_replace('_', ' ', $key)) . ' (' . $size['width'] . 'x' . $size['height'] . ')';
            }
            // Add the scaled image size option
            $big_image_size_threshold = apply_filters('big_image_size_threshold', 2560);
            $thumbs['full'] = 'Scaled (' . $big_image_size_threshold . 'x' . $big_image_size_threshold . ')';
            foreach ($thumbs as $key => $option) {
                echo "<label><input id='squeeze_setting_".esc_attr($label_for)."_".esc_attr($key)."' name='squeeze_options[".esc_attr($label_for)."][".esc_attr($key)."]' type='checkbox' ".checked( array_key_exists($key, $value), true, false )." /> ".esc_html($option)."</label><br>";
            }
            break;
    }
}

/**
 * Get default value for option
 * @param string $option
 * @param bool $all
 */
function squeeze_get_default_value ( $option, $all = false ) {
    $options_defaults = apply_filters('squeeze_options_default', 
    array(
        // JPEG settings
        'jpeg_quality' => 75,
        'jpeg_baseline' => false,
        'jpeg_arithmetic' => false,
        'jpeg_progressive' => true,
        'jpeg_optimize_coding' => true,
        'jpeg_smoothing' => 0,
        'jpeg_color_space' => 3,
        'jpeg_quant_table' => 3,
        'jpeg_trellis_multipass' => false,
        'jpeg_trellis_opt_zero' => false,
        'jpeg_trellis_opt_table' => false,
        'jpeg_trellis_loops' => 1,
        'jpeg_auto_subsample' => true,
        'jpeg_chroma_subsample' => 2,
        'jpeg_separate_chroma_quality' => false,
        'jpeg_chroma_quality' => 75,

        // PNG settings
        'png_level' => 2,
        'png_interlace' => false,

        // WEBP settings
        'webp_method' => 4,
        'webp_quality' => 75,
        'webp_lossless' => false,
        'webp_near_lossless' => 100,

        // AVIF settings
        'avif_cqLevel' => 70,

        // General settings
        'auto_compress' => true,
        'backup_original' => true,
        'compress_thumbs' => array( 'large' => 'on', 'full' => 'on' ),
        'timeout' => 60,
    )
    );
    if ($all) {
        return $options_defaults;
    }
    return in_array($option, array_keys($options_defaults)) ? $options_defaults[$option] : false;
}

function squeeze_setting_basic_desc() {
    echo '<p>'.esc_html__('Basic options', 'squeeze').'</p>';
}
function squeeze_setting_jpeg_desc() {
    echo '<p>'.esc_html__('Compress settings for JPEG images using MozJPEG encoder', 'squeeze').'</p>';
}
function squeeze_setting_png_desc() {
    echo '<p>'.esc_html__('Compress settings for PNG images using OxiPNG encoder', 'squeeze').'</p>';
}
function squeeze_setting_webp_desc() {
    echo '<p>'.esc_html__('Compress settings for WEBP images using WebP encoder', 'squeeze').'</p>';
}

function squeeze_setting_avif_desc() {
    echo '<p>'.esc_html__('Compress settings for AVIF images using AVIF encoder', 'squeeze').'</p>';
}

add_action('wp_ajax_squeeze_restore_defaults', 'squeeze_restore_defaults');
/**
 * Restore default settings
 */
function squeeze_restore_defaults() {
    check_ajax_referer( 'squeeze-nonce', '_ajax_nonce' );
    if (get_option('squeeze_options')) {
        $result = delete_option('squeeze_options', "");
        if (!$result) {
            wp_send_json_error($result);
        }
        wp_send_json_success($result);
    }
    wp_send_json_success(true);
}

add_action( 'admin_init', 'squeeze_add_notices' );
/**
 * Add custom admin notices
 */
function squeeze_add_notices() {
    global $pagenow;

	if ( is_admin() && $pagenow === "upload.php" && isset($_GET['page']) && $_GET['page'] === "squeeze" && isset($_GET['restore_defaults']) && !isset($_GET['settings-updated']) ) {
        add_settings_error( 'squeeze_notices', 'settings_restored', __( 'Settings have been restored.', 'squeeze' ), 'success' );
	}

}

add_filter('attachment_fields_to_edit', 'squeeze_add_custom_field_to_attachment', 10, 2); 
/**
 * Add custom text/textarea attachment field
 */
function squeeze_add_custom_field_to_attachment( $form_fields, $post ) {
	$allowed_mimes = SQUEEZE_ALLOWED_IMAGE_MIME_TYPES;
	if ( in_array( $post->post_mime_type, $allowed_mimes ) ) {
		$is_compressed = get_post_meta($post->ID, 'squeeze_is_compressed', true);
		$can_restore = squeeze_can_restore($post->ID);
		$form_fields['squeeze_is_compressed'] = array(
			'label' => __('Squeeze', 'squeeze'),
			'input' => 'html',
			'html' => ($is_compressed ? 
				'<label><span class="squeeze_status"><span style="padding-top: 0; line-height: 1; color: green;" class="dashicons dashicons-yes-alt"></span>&nbsp;' . __('Compressed', 'squeeze') . '</span></label>' . ($can_restore ? '
				<br><br><p><button name="squeeze_restore" type="button" class="button button-secondary squeeze-restore-button" data-attachment="' . $post->ID . '">' . __('Restore original', 'squeeze') . '</button></p>' : '') . '<p>
                <button name="squeeze_compress_again" type="button" class="button button-primary squeeze-compress-button" data-attachment="' . $post->ID . '">' . __('Compress again', 'squeeze') . '</button></p>'
				: 
				'<label><span class="squeeze_status"><span style="padding-top: 0; line-height: 1; color: red;" class="dashicons dashicons-no-alt"></span>&nbsp;' . __('Not compressed', 'squeeze') . '</span></label>
				<br><br><button name="squeeze_compress_single" type="button" class="button button-primary squeeze-compress-button" data-attachment="' . $post->ID . '">' . __('Compress', 'squeeze') . '</button>'
                )
		);
	}
    return $form_fields;
}

add_filter( 'manage_media_columns', 'squeeze_add_media_columns' );
/**
 * Filter the Media list table columns to add a Squeeze column.
 *
 * @param array $posts_columns Existing array of columns displayed in the Media list table.
 * @return array Amended array of columns to be displayed in the Media list table.
 */
function squeeze_add_media_columns( $posts_columns ) {
	$posts_columns['squeeze'] = __( 'Squeeze', 'squeeze' );

	return $posts_columns;
}

add_action( 'manage_media_custom_column', 'squeeze_media_custom_column', 10, 2 );
/**
 * Display attachment uploaded time under `Time` custom column in the Media list table.
 *
 * @param string $column_name Name of the custom column.
 */
function squeeze_media_custom_column( $column_name, $post_id ) {
	if ( 'squeeze' !== $column_name ) {
		return;
	}

    $form_fields = squeeze_add_custom_field_to_attachment( array(), get_post( $post_id ) );

    if ($form_fields) {
	    echo wp_kses_post($form_fields['squeeze_is_compressed']['html']);
    }

}

add_filter('manage_upload_sortable_columns', 'squeeze_sortable_columns');
/**
 * Add sortable Squeeze column
 */
function squeeze_sortable_columns($columns) {
    $columns['squeeze'] = 'squeeze';
    return $columns;
}

add_action('pre_get_posts', 'squeeze_sortable_columns_orderby');
/**
 * Order by Squeeze column
 */
function squeeze_sortable_columns_orderby($query) {
    if (!is_admin() || !$query->is_main_query()) {
        return;
    }

    $orderby = $query->get('orderby');

    if ('squeeze' === $orderby) {

        // Define the allowed image formats
        $allowed_formats = SQUEEZE_ALLOWED_IMAGE_MIME_TYPES;

        // include all media
        $query->set('meta_query', array(
            'relation' => 'OR',
            array(
                'key' => 'squeeze_is_compressed',
                'compare' => 'NOT EXISTS'
            ),
            array(
                'key' => 'squeeze_is_compressed',
                'compare' => 'EXISTS'
            )
        ));

        // Add the meta_query to filter by specific image formats
        //$query->set('post_mime_type', $allowed_formats);

        $query->set('orderby', 'meta_value');
    }
}


add_filter( 'post_mime_types', 'squeeze_media_filter' );
/**
 * Add a new filter to the media library
 */
function squeeze_media_filter( $mime_types ) {
    $mime_types_string = implode(',', SQUEEZE_ALLOWED_IMAGE_MIME_TYPES);
    $extentions = explode(',', SQUEEZE_ALLOWED_IMAGE_FORMATS);
    $mime_types[$mime_types_string] = array(
        __( 'Squeeze Supported', 'squeeze' ),
        __( 'Images that can be compressed by Squeeze', 'squeeze' ),
        $extentions
    );

    return $mime_types;
}