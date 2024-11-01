=== Squeeze ===
Contributors: barb0ss
Tags: compress, image, compression, bulk, optimisation
Requires at least: 6.0
Tested up to: 6.6.2
Requires PHP: 7.0
Stable tag: 1.4.6
License: GNU GPL v3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

The Squeeze plugin for WordPress allows you to easily optimize and compress images on your website using the [Squoosh.app](https://squoosh.app) compression scripts.

== Description ==
This plugin uses [Squoosh.app](https://squoosh.app) compression scripts, allowing you to compress images directly from your WordPress media library or during the image upload process. All the compressions are handled directly inside your browser. That means there’s no third party service for compression images. Thus, you can be sure with the privacy of your images.
**Important notice: this is NOT the official Squoosh.app plugin. It only uses squoosh.app compression scripts.**

== Features ==
* Image Compression: Automatically compresses images in your WordPress media library using Squoosh.app advanced compression algorithms.
* Upload Optimization: Compresses images on-the-fly during the upload process, ensuring optimized images are added to your media library.
* Bulk Compression: Allows you to compress multiple images at once.
* Selective Compression: Choose which images to compress based on your preferences and requirements.
* Custom Compression Settings: Adjust compression parameters such as quality, resizing, and format options to suit your specific needs.
* Restore Option: Provides a restore option to use backup file to restore compressed image to the original image.
* Custom Path Compression: Select a folder on your site and compress all the images within that folder.

== Installation ==
1. Download the plugin ZIP file from the WordPress Plugin Directory, or install the plugin via the WordPress plugin installer.
2. Extract the ZIP file (if downloaded from WordPress Plugin Directory).
3. Upload the plugin folder to the wp-content/plugins/ directory of your WordPress installation.
4. Activate the Squeeze plugin from the WordPress plugins dashboard.

== Frequently Asked Questions ==
= What does the speed of image compression depend on? =

Because the compression process happens directly into your browser - it depends on your device’s performance. 

= Image compression process seems to be stuck. The browser doesn't respond. =

It may happen if you are trying to compress a PNG image with a high resolution. In that case, you should wait a while, until the image finishes its compression or a “Request timed out.” error message occurs.

= How to fix a “Request timed out” error =

Go to the plugin’s setting page (Media -> Squeeze Settings).
At the “Basic Settings” tab increase the value of the field “Compression timeout (in seconds)”. By default it equals 60 seconds, try to make it bigger. If the error still persists, that means the script cannot process your image. 

= How does the plugin work? =

The plugin uses Squoosh.app's compression algorithms and provides you with the ability to compress images in your WordPress media library or during the image upload process.

= How are the images processed? Are they sent to an external server? =

This plugin uses Squoosh.app compression scripts. The images compressed directly in your browser – means no external server used. Squoosh does all the work locally. So you should not worry about privacy.

= Why should I use image compression on my website? =

Image compression helps improve your website's performance by reducing the file size of images without significantly impacting their quality. Smaller image files load faster, resulting in faster page load times and a better user experience. Additionally, compressed images consume less bandwidth, which can be beneficial for websites with limited hosting resources or mobile users with limited data plans.

= Which image formats does the Squeeze plugin work with? =

Currently, the Squeeze plugin supports JPG, PNG, WEBP and AVIF image formats.

= Can I compress multiple images at once? =

Yes, the plugin provides a bulk compression feature. This saves time and effort compared to compressing images individually.

= Can I compress images NOT from the Media Library, but from a custom folder? =

Yes, you can compress images from any folder within your WordPress installation.

= Can I customize the compression settings? =

Yes, the plugin allows you to customize various compression settings according to your preferences. It supports the same options as Squoosh.app provides. 

= How can I test compression settings before uploading my images to the media library? =

You can test different options directly on [Squoosh.app](https://squoosh.app). For JPG images select MozJPEG encoder, for PNG images choose OxiPNG.

== Screenshots ==
1. Squeeze's Basic Settings
2. Squeeze's JPEG compression options
3. Squeeze's PNG compression options
4. Squeeze's WEBP compression options
5. Squeeze's AVIF compression options
6. Squeeze Bulk Compression Page
7. Squeeze Restore Option
8. Non-optimised image
9. Optimised image with Squeeze Plugin
10. Bulk restore and bulk compress options in the list view of the Media Library

== Changelog ==
= 1.4.6 =
* Bulk compress option for the list view of the Media Library
* Pause/Resume option for the bulk compress process
* Fixed bugs with the list mode
* Fixed bug when bulk process stuck if image processing failed
* Added timeout for image compression process
* Added scaled image size for compression
* Refactored JS code
= 1.4.5 =
* Add bulk restore option to the list view of Media Library
* Compress selected thumbnails separately
= 1.4.4 =
* Delete .bak file on media delete
= 1.4.3 =
* Fixed minor JS bug
= 1.4.2 =
* Fixed security issue: check permissions for file upload
= 1.4.1 =
* Fixed security issue: Arbitrary File Upload
= 1.4 =
* Add AVIF support
= 1.3 =
* Add WEBP support
* Update settings page layout with tabs
* Add ability to re-compress images
* Add ability to compress images from custom folder
= 1.2 =
* Fix minor bug in Media library
= 1.1 =
* Fix PNG compressor
= 1.0 =
* First release.

== Upgrade Notice ==
= 1.4.6 =
* Bulk compress option for the list view of the Media Library
* Pause/Resume option for the bulk compress process
* Fixed bugs with the list mode
* Fixed bug when bulk process stuck if image processing failed
* Added timeout for image compression process
* Refactored JS code
= 1.4.5 =
* Add bulk restore option to the list view of Media Library
* Compress selected thumbnails separately
= 1.4 =
* Add AVIF support
= 1.3 =
* Add WEBP support
* Update settings page layout with tabs
* Add ability to re-compress images
* Add ability to compress images from custom folder
= 1.2 =
* Fix minor bug in Media library
= 1.1 =
* Fix PNG compressor
= 1.0 =
* First release.