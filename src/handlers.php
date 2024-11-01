<?php
// Exit if accessed directly.
if (!defined('ABSPATH')) {
	exit;
}

add_action('wp_ajax_squeeze_update_attachment', 'squeeze_update_attachment');
/**
 * Update attachment with compressed image
 * https://gist.github.com/cyberwani/ad5452b040001878d692c3165836ebff
 */
function squeeze_update_attachment() {
	check_ajax_referer( 'squeeze-nonce', '_ajax_nonce' );
	if (!current_user_can('upload_files')) {
		wp_send_json_error('❌ '.__('You do not have permission to upload files', 'squeeze'));
	}
	if (isset($_POST["base64"]) && !empty($_POST["base64"])) {

		$base64 = sanitize_text_field($_POST["base64"]);
		$sizes = $_POST["base64Sizes"];
		$file_format = sanitize_text_field($_POST["format"]);
		$filename = sanitize_text_field($_POST["filename"]);
		$extension = pathinfo($filename, PATHINFO_EXTENSION);

		if (!in_array($extension, explode(',', SQUEEZE_ALLOWED_IMAGE_FORMATS))) {
			wp_send_json_error('❌ '.__('Invalid image format', 'squeeze'));
		}

		$attach_id = (int) $_POST["attachmentID"];
		$meta_data = wp_get_attachment_metadata($attach_id);
        $url = sanitize_url($_POST["url"]);
		$process = sanitize_text_field($_POST["process"]); // process: all, uncompressed, path

		$options = get_option( 'squeeze_options' );
		$is_backup_original = isset($options['backup_original']) ? $options['backup_original'] : squeeze_get_default_value('backup_original');

		// Upload dir.
		// TBD: fix if non-latin characters in filename
		if ($attach_id > 0) {
			$upload_dir = str_replace($filename, "", wp_get_original_image_path($attach_id)); // get upload dir from attachment path
		} else {
			$upload_url = str_replace($filename, "", $url);
			$upload_dir = str_replace(home_url(), ABSPATH, $upload_url);
		}
		$upload_path = str_replace('/', DIRECTORY_SEPARATOR, $upload_dir) . DIRECTORY_SEPARATOR;

		$img = str_replace('data:image/'.$file_format.';base64,', '', $base64);
		$img = str_replace(' ', '+', $img);
		$decoded = base64_decode($img);

		if ($is_backup_original && $process !== 'path') {
			// backup original
			// TBD: check if .bak already in filename
			$backup_filename = preg_replace("/(\.(?!.*\.))/", '.bak.', $filename); // add .bak. before extension

			if ( !file_exists($upload_path . $backup_filename) ) {
				$upload_backup_file = copy($upload_path . $filename, $upload_path . $backup_filename);

				if (!$upload_backup_file) {
					wp_send_json_error('❌ '.__('Backup original image failed', 'squeeze') . ': '. $upload_path . $backup_filename);
				}
			}
		}

		// Save the image in the uploads directory.

		global $wp_filesystem;
		// Initialize the WP filesystem, no more using 'file-put-contents' function
		if (empty($wp_filesystem)) {
			require_once (ABSPATH . '/wp-admin/includes/file.php');
			WP_Filesystem();
		}

		$sizes['original']['original_size'] = filesize($upload_path . $filename);
		$upload_file = $wp_filesystem->put_contents($upload_path . $filename, $decoded);
		$sizes['original']['compressed_size'] = strlen($decoded);

		if (!$upload_file) {
			wp_send_json_error('❌ '.__('Upload image failed', 'squeeze'). ': '. $upload_path . '::' . $filename . '::' . $upload_dir . '::' . $upload_url);
		}

		// upload thumbnails
		if ($process !== 'path') {
			update_post_meta($attach_id, "squeeze_is_compressed", true);

			foreach ($sizes as $size_name => $size_data) {
				if ($size_name === 'original') {
					continue;
				}
				$size_base64 = sanitize_text_field($size_data['base64']);
				$size_base64 = str_replace('data:image/'.$file_format.';base64,', '', $size_base64);
				$size_base64 = str_replace(' ', '+', $size_base64);
				$size_decoded = base64_decode($size_base64);
				$size_filename = basename(sanitize_url($size_data['url']));

				if ($size_name === 'full') {
					$size_name = 'scaled';
					unset($sizes['full']);
				}
				
				$sizes[$size_name]['original_size'] = filesize($upload_path . $size_filename);

				$upload_size_file = $wp_filesystem->put_contents($upload_path . $size_filename, $size_decoded);

				if (!$upload_size_file) {
					wp_send_json_error('❌ '.__('Attachment not updated', 'squeeze'). ': ' . $upload_path . $size_filename);
				} else {
					$sizes[$size_name]['compressed_size'] = strlen($size_decoded);
				}
			}

			$response_msg = squeeze_get_comparison_table($sizes); //$filename. ',<br>' . rtrim($response_msg, ',<br> ');
			$response_msg = '<strong>✅ '.__('Compressed successfully', 'squeeze') . ':</strong> ' . $response_msg;

			wp_send_json_success($response_msg);
		} else {
			wp_send_json_success('✅ '.__('Compressed successfully', 'squeeze'));
		}

	}
	wp_die();
}

//add_filter('wp_redirect', 'squeeze_single_upload_redirect', 10, 2);
/**
 * TBD: Handle single upload
 * Redirect to compressing image after single upload
 * 
 * @param string $location
 * @param int $status
 * @return string
 */
function squeeze_single_upload_redirect($location, $status) {
	if (is_admin() && $location === admin_url('upload.php')) {
		//print_r($_REQUEST);
		print_r($_POST);
		print_r($_FILES);
		$location =  '';//admin_url('upload.php?page=squeeze&attachmentID=123');
	}
	return $location;
}

/**
 * Get comparison table of original and compressed image
 */
function squeeze_get_comparison_table($sizes) {
	$table = '<style>.squeeze-comparison-table table tr {display: table-row;}</style>';
	$table .= '<div class="squeeze-comparison-table">';
	$table .= '<table class="wp-list-table widefat striped">';
	$table .= '<thead><tr><th>'.__('Size', 'squeeze').'</th><th>'.__('Original', 'squeeze').'</th><th>'.__('Squeezed', 'squeeze').'</th><th>'.__('Savings', 'squeeze').'</th></tr></thead>';
	$table .= '<tbody>';

	foreach ($sizes as $size_name => $size_data) {
		$size_filename = basename(sanitize_url($size_data['url']));
		$original_size = $size_data['original_size'];
		$compressed_size = $size_data['compressed_size'];
		$savings = $original_size - $compressed_size;
		$savings_percent = round(($savings / $original_size) * 100, 2);

		$table .= '<tr>';
		$table .= '<td><strong>'.$size_name.'</strong></td>';
		$table .= '<td>'.size_format($original_size, 0).'</td>';
		$table .= '<td>'.size_format($compressed_size, 0).'</td>';
		$table .= '<td>'.$savings_percent.'%</td>';
		$table .= '</tr>';
	}

	$table .= '</tbody></table></div>';

	return $table;
}

add_action('wp_ajax_squeeze_restore_attachment', 'squeeze_restore_attachment');
/**
 * Restore original attachment
 */
function squeeze_restore_attachment() {
	check_ajax_referer( 'squeeze-nonce', '_ajax_nonce' );
	if (isset($_POST["attachmentID"]) && !empty($_POST["attachmentID"]) && wp_get_attachment_url($_POST["attachmentID"])) {
		$attach_id = (int) $_POST["attachmentID"];
		$can_restore = squeeze_can_restore($attach_id);

		if ($can_restore) {
			$is_restore_attachment = _squeeze_restore_attachment($attach_id);

			if ($is_restore_attachment) {
				wp_send_json_success('✅ '.__('Restored successfully', 'squeeze'));
			} else {
				wp_send_json_error('❌ '.__('Attachment not restored', 'squeeze'));
			}

		}
	} else {
		wp_send_json_error('❌ '.__('Attachment not found', 'squeeze'));
	}
	wp_die();
}

add_action('wp_ajax_squeeze_get_attachment', 'squeeze_get_attachment');
/**
 * Get attachment data
 */
function squeeze_get_attachment() {
	check_ajax_referer( 'squeeze-nonce', '_ajax_nonce' );

	if (isset($_POST["attachmentID"]) && !empty($_POST["attachmentID"]) && wp_get_attachment_url($_POST["attachmentID"])) {
		$attach_id = (int) $_POST["attachmentID"];
		$sizes = wp_get_attachment_metadata($attach_id);
		$sizes = $sizes['sizes'];
		$full_image = wp_get_attachment_image_src($attach_id, 'full');
		$sizes['full'] = array(
			'url' => $full_image[0],
			'width' => $full_image[1],
			'height' => $full_image[2],
		);
		foreach ($sizes as $size_name => $size_data) {
			$sizes[$size_name]['url'] = wp_get_attachment_image_url($attach_id, $size_name);
		}
		$attach_data = array(
			'id' => $attach_id,
			'url' => wp_get_original_image_url($attach_id), //TBD
			'mime' => get_post_mime_type($attach_id),
			'name' => get_the_title($attach_id),
			'filename' => basename( wp_get_original_image_path( $attach_id ) ),
			'sizes' => $sizes,
		);

		wp_send_json_success($attach_data);

	} else {
		wp_send_json_error('❌ '.__('Attachment not found', 'squeeze'));
	}

	wp_die();
}

add_action('wp_ajax_squeeze_get_attachment_by_path', 'squeeze_get_attachment_by_path');
/**
 * Get attachment data by path
 */
function squeeze_get_attachment_by_path() {
	check_ajax_referer( 'squeeze-nonce', '_ajax_nonce' );

	if (isset($_POST["path"]) && !empty($_POST["path"])) {
		$path = sanitize_text_field($_POST["path"]);
		$images = glob( ABSPATH . $path . '*.{'.SQUEEZE_ALLOWED_IMAGE_FORMATS.'}', GLOB_BRACE);
		$attach_data = array();

		if (empty($images)) {
			wp_send_json_error('❌ '.__('Images not found in the path', 'squeeze') . ' ' . $path);
		}

		foreach ($images as $image) {
			$attach_id = attachment_url_to_postid($image);
			$attach_mime = image_type_to_mime_type(exif_imagetype($image));
			$attach_url = str_replace(ABSPATH, home_url(), $image);
			$attach_name = pathinfo($image, PATHINFO_FILENAME);
			$attach_data[] = array(
				'id' => $attach_id,
				'url' => $attach_url,
				'mime' => $attach_mime,
				'name' => $attach_name,
				'filename' => basename( $image ),
			);
		}

		wp_send_json_success($attach_data);

	} else {
		wp_send_json_error('❌ '.__('Path not found', 'squeeze'));
	}

	wp_die();
}

/**
 * Check if attachment can be restored
 * 
 * @param int $attach_id
 * @return bool
 */
function squeeze_can_restore($attach_id) {
	$original_img_path = wp_get_original_image_path((int) $attach_id);
	$backup_img_path = preg_replace("/(\.(?!.*\.))/", '.bak.', $original_img_path);
	$can_restore = file_exists($backup_img_path);

	return $can_restore;
}

/**
 * Handle restore attachment
 * Internal function
 * 
 * @param int $attach_id
 * @return bool
 */
function _squeeze_restore_attachment($attach_id, $is_bulk = false) {
	$original_img_path = wp_get_original_image_path($attach_id);
	$backup_img_path = preg_replace("/(\.(?!.*\.))/", '.bak.', $original_img_path);
	$upload_restore_file = copy($backup_img_path, $original_img_path);

	if (!$upload_restore_file) {
		if ($is_bulk) {
			wp_die('❌ '.__('Restore original image failed', 'squeeze'));
		} else {
			wp_send_json_error('❌ '.__('Restore original image failed', 'squeeze'));
		}
		return false;
	}

	// create thumbnails from original image
	$attach_data = wp_create_image_subsizes($original_img_path, $attach_id); 

	$is_update_attachment = delete_post_meta($attach_id, "squeeze_is_compressed");

	if ($is_update_attachment) {
		wp_delete_file($backup_img_path); // delete backup file
		return true;
	} else {
		return false;
	}
}

add_action('delete_attachment', 'squeeze_delete_attachment');
/**
 * Delete backup image when attachment is deleted
 * 
 * @param int $attach_id
 */
function squeeze_delete_attachment($attach_id) {
	$original_img_path = wp_get_original_image_path((int) $attach_id);
	$backup_img_path = preg_replace("/(\.(?!.*\.))/", '.bak.', $original_img_path);

	if (file_exists($backup_img_path)) {
		wp_delete_file($backup_img_path);
	}
}

add_filter('bulk_actions-upload', 'squeeze_bulk_actions');
/**
 * Add bulk action to media library
 * 
 * @param array $actions
 * @return array
 */
function squeeze_bulk_actions($actions) {
	$actions['squeeze_bulk_restore'] = __('Restore Original', 'squeeze');
	$actions['squeeze_bulk_compress'] = __('Squeeze and compress', 'squeeze');
	return $actions;
}

add_filter('handle_bulk_actions-upload', 'squeeze_handle_bulk_actions', 10, 3);
/**
 * Handle bulk action
 * 
 * @param string $redirect_to
 * @param string $doaction
 * @param array $post_ids
 * @return string
 */
function squeeze_handle_bulk_actions($redirect_to, $doaction, $post_ids) {
	if ($doaction === 'squeeze_bulk_restore') {
		foreach ($post_ids as $post_id) {
			$can_restore = squeeze_can_restore($post_id);

			if ($can_restore) {
				$is_restore_attachment = _squeeze_restore_attachment($post_id, true);
			}
		}

		$redirect_to = add_query_arg('squeeze_bulk_restored', count($post_ids), $redirect_to);
	}

	if ($doaction === 'squeeze_bulk_compress') {
		foreach ($post_ids as $post_id) {
			$redirect_to = add_query_arg('squeeze_bulk_compressed', count($post_ids), $redirect_to);
		}
	}


	return $redirect_to;
}

add_action('admin_notices', 'squeeze_bulk_action_admin_notice');
/**
 * Display admin notice after bulk action
 */
function squeeze_bulk_action_admin_notice() {
	if (!empty($_REQUEST['squeeze_bulk_restored'])) { // TBD: calculate actual number of restored images
		$message = sprintf(
			_n(
				'Attachment restored.',
				'%d attachments restored.',
				$_REQUEST['squeeze_bulk_restored'],
				'squeeze'
			),
			number_format_i18n($_REQUEST['squeeze_bulk_restored'])
		);
		printf('<div class="notice notice-success is-dismissible"><p>%s</p></div>', $message);
	}
	if (!empty($_REQUEST['squeeze_bulk_compressed'])) { // TBD: calculate actual number of compressed images
		$message = sprintf(
			_n(
				'Attachment compressed.',
				'%d attachments compressed.',
				$_REQUEST['squeeze_bulk_compressed'],
				'squeeze'
			),
			number_format_i18n($_REQUEST['squeeze_bulk_compressed'])
		);
		printf('<div class="notice notice-success is-dismissible"><p>%s</p></div>', $message);
	}
}

add_filter('image_size_names_choose', 'squeeze_custom_image_sizes');
/**
 * Add custom image sizes to media library
 * 
 * @param array $sizes
 * @return array
 */
function squeeze_custom_image_sizes($sizes) {
	$available_sizes = wp_get_registered_image_subsizes();

	foreach ($available_sizes as $size_name => $size_data) {
		$sizes[$size_name] = $size_data['width'] . 'x' . $size_data['height'];
	}

	return $sizes;
}