import * as avif from '@jsquash/avif';
import * as webp from '@jsquash/webp';
import * as jpeg from '@jsquash/jpeg';
import * as png from '@jsquash/png';
import optimise from '@jsquash/oxipng/optimise';
const { __ } = wp.i18n; // Import __() from wp.i18n

export default class SQUEEZE {

  constructor(squeeze) {
    this.options = JSON.parse(squeeze.options); // plugin options
    this.nonce = squeeze.nonce; // nonce
    this.ajaxUrl = squeeze.ajaxUrl; // ajax url
  }

  /**
   * Decode image buffer and return image data
   * @param {string} sourceType  - avif, jpeg, png, webp
   * @param {object} fileBuffer - The ArrayBuffer object is used to represent a generic raw binary data buffer.
   * @returns {object | Error} - Image data object or throws an Error
   */
  decode = async (sourceType, fileBuffer) => {
    switch (sourceType) {
      case 'avif':
        return await avif.decode(fileBuffer);
      case 'jpeg':
        return await jpeg.decode(fileBuffer);
      case 'png':
        return await png.decode(fileBuffer);
      case 'webp':
        return await webp.decode(fileBuffer);
      default:
        throw new Error(`Unknown source type: ${sourceType}`);
    }
  }

  /**
   * 
   * @param {string} outputType - avif, jpeg, png, webp 
   * @param {object} imageData - Image data object after decoding
   * @returns {ArrayBuffer | false} - Compressed image buffer or false if error
   */
  encode = async (outputType, imageData) => {
    try {
      switch (outputType) {
        case 'avif':
          const avifOptions = {}
          for (const [key, value] of Object.entries(this.options)) {
            if (key.includes('avif')) {
              const keyName = key.replace('avif_', '')
              avifOptions[keyName] = value
            }
          }
          return await avif.encode(imageData, avifOptions);
        case 'jpeg':
          const jpegOptions = {}
          for (const [key, value] of Object.entries(this.options)) {
            if (key.includes('jpeg')) {
              const keyName = key.replace('jpeg_', '')
              jpegOptions[keyName] = value
            }
          }
          return await jpeg.encode(imageData, jpegOptions);
        case 'png':
          const pngOptions = {}
          for (const [key, value] of Object.entries(this.options)) {
            if (key.includes('png')) {
              const keyName = key.replace('png_', '')
              pngOptions[keyName] = value
            }
          }
          return await png.encode(imageData, pngOptions);
        case 'webp':
          const webpOptions = {}
          for (const [key, value] of Object.entries(this.options)) {
            if (key.includes('webp')) {
              const keyName = key.replace('webp_', '')
              webpOptions[keyName] = value
            }
          }
          return await webp.encode(imageData, webpOptions);
        default:
          throw new Error(`Unknown output type: ${outputType}`);
      }
    } catch (error) {
      //console.error(error)
      throw new Error(`Error encoding image: ${error.message}`)
    }

  }

  /**
   * Convert image buffer from one format to another
   * @param {string} sourceType - avif, jpeg, png, webp
   * @param {string} outputType - avif, jpeg, png, webp
   * @param {object} fileBuffer - The ArrayBuffer object is used to represent a generic raw binary data buffer.
   * @returns {Promise} - Compressed image buffer or false if error
   */
  convert = async (sourceType, outputType, fileBuffer, pngOptions = {}) => {
    try {
      if (outputType === 'png') { // TBD: https://github.com/jamsinclair/jSquash/tree/main/packages/oxipng#activate-multithreading
        
        fileBuffer = await optimise(fileBuffer, pngOptions);
        
        return fileBuffer;
      }

      const imageData = await this.decode(sourceType, fileBuffer);

      return this.encode(outputType, imageData);
    } catch (error) {
      console.error('Error during image processing:', error);
      throw new Error('Failed to process image, check the console for more information.');
    }
  }

  /**
   * Convert Blob to base64 encoded image string
   * @param {object} blob - The Blob object represents a blob, which is a file-like object of immutable, raw data.
   * @returns {Promise<string>} - Base64 encoded image string
   */
  blobToBase64 = (blob) => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  showOutput = async (imageBuffer, outputType) => {
    if (!imageBuffer) {
      return false;
    }
    const imageBlob = new Blob([imageBuffer], { type: `image/${outputType}` });
    const base64String = await this.blobToBase64(imageBlob);

    return base64String;
  }

  /**
   * Compresses a JPEG image.
   * @param {Object} params - The parameters for compression.
   * @param {string} params.url - The URL of the image.
   * @param {string} params.name - The name of the image file.
   * @param {string} params.sourceType - The source type of the image.
   * @param {string} params.outputType - The desired output type.
   * @param {string} params.mime - The MIME type of the image.
   * @returns {Promise<string>} - The base64 encoded compressed image.
   */
  compressJPEG = async ({ url, name, sourceType, outputType, mime }) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const metadata = {
      type: mime
    };
    const imageObj = new File([blob], name, metadata);
    const fileBuffer = await imageObj.arrayBuffer();
    const imageBuffer = await this.convert(sourceType, outputType, fileBuffer);
    const base64 = await this.showOutput(imageBuffer, outputType);

    return base64;
  }

  /**
   * Compresses a PNG image.
   * @param {Object} params - The parameters for compression.
   * @param {string} params.url - The URL of the image.
   * @param {Object} params.options - The options for PNG compression.
   * @param {string} params.outputType - The desired output type.
   * @returns {Promise<string>} - The base64 encoded compressed image.
   */
  compressPNG = async ({ url, outputType }) => {
    const pngOptions = {};
    for (const [key, value] of Object.entries(this.options)) {
      if (key.includes('png')) {
        const keyName = key.replace('png_', '');
        pngOptions[keyName] = value;
      }
    }
    const fileBuffer = await fetch(url).then(res => res.arrayBuffer());
    const imageBuffer = await this.convert(outputType, outputType, fileBuffer, pngOptions);
    const base64 = await this.showOutput(imageBuffer, outputType);

    return base64;
  }

  /**
   * Compresses a WEBP image.
   * @param {Object} params - The parameters for compression.
   * @param {string} params.url - The URL of the image.
   * @param {string} params.name - The name of the image file.
   * @param {string} params.sourceType - The source type of the image.
   * @param {string} params.outputType - The desired output type.
   * @param {string} params.mime - The MIME type of the image.
   * @returns {Promise<string>} - The base64 encoded compressed image.
   */
  compressWEBP = async ({ url, name, sourceType, outputType, mime }) => {
    const webpResponse = await fetch(url);
    const webpBlob = await webpResponse.blob();
    const webpMetadata = {
      type: mime
    };
    const webpImageObj = new File([webpBlob], name, webpMetadata);
    const fileBuffer = await webpImageObj.arrayBuffer();
    const imageBuffer = await this.convert(sourceType, outputType, fileBuffer);
    const base64 = await this.showOutput(imageBuffer, outputType);

    return base64;
  }

  /**
   * Compresses an AVIF image.
   * @param {Object} params - The parameters for compression.
   * @param {string} params.url - The URL of the image.
   * @param {string} params.name - The name of the image file.
   * @param {string} params.sourceType - The source type of the image.
   * @param {string} params.outputType - The desired output type.
   * @param {string} params.mime - The MIME type of the image.
   * @returns {Promise<string>} - The base64 encoded compressed image.
   */
  compressAVIF = async ({ url, name, sourceType, outputType, mime }) => {
    const avifResponse = await fetch(url);
    const avifBlob = await avifResponse.blob();
    const avifMetadata = {
      type: mime
    };
    const avifImageObj = new File([avifBlob], name, avifMetadata);
    const fileBuffer = await avifImageObj.arrayBuffer();
    const imageBuffer = await this.convert(sourceType, outputType, fileBuffer);
    const base64 = await this.showOutput(imageBuffer, outputType);

    return base64;
  }

  compressAndAssign = async (compressFunction, { url, name, sourceType, outputType, mime }) => {

    let base64;

    if (compressFunction === this.compressPNG) {
      base64 = await compressFunction({ url, outputType });
    } else {
      base64 = await compressFunction({ url, name, sourceType, outputType, mime });
    }

    return base64;
  }

  compressAndAssignThumbs = async (compressFunction, { name, sourceType, outputType, mime, sizes }, skipFull = false) => {
    const compressThumbs = this.options.compress_thumbs;
    const base64Sizes = {}

    if (!sizes) {
      return base64Sizes;
    }

    for (const [key, value] of Object.entries(sizes)) {
      if (!(key in compressThumbs)) {
        continue;
      }

      if (skipFull && key === 'full') { // skip full size if no scaled image
        continue;
      }

      const sizeURL = value.url;
      const sizeWidth = value.width;
      const sizeHeight = value.height;
      const sizeName = `${name}-${sizeWidth}x${sizeHeight}`;
      let sizeBase64;

      if (compressFunction === this.compressPNG) {
        sizeBase64 = await compressFunction({ url: sizeURL, outputType });
      } else {
        sizeBase64 = await compressFunction({ url: sizeURL, name: sizeName, sourceType, outputType, mime });
      }

      Object.assign(base64Sizes, { [key]: { 'url': sizeURL, 'base64': sizeBase64 } });
    }

    return base64Sizes;
  }

  timeoutCompress = (ms, promise) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(__('Request timed out.', 'squeeze')));
      }, ms);

      promise.then(
        (res) => {
          clearTimeout(timeoutId);
          resolve(res);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      );
    });
  }

  handleCompress = async ( attachment ) => {
    const attachmentData = attachment.attributes;
    const url = attachmentData?.originalImageURL ?? attachmentData.url;
    const mime = attachmentData.mime;
    const name = attachmentData.name;
    const filename = attachmentData?.originalImageName ?? attachmentData.filename;
    const attachmentID = attachmentData.id;
    const sizes = attachmentData.sizes;
    const format = mime.split("/")[1];
    const sourceType = format;
    const outputType = format;
    const skipFull = attachmentData.originalImageName === undefined ? true : false;
    const timeout = parseInt(this.options.timeout) * 1000; // convert to milliseconds

    //console.log(attachmentData, 'attachmentData')

    let base64;
    let base64Sizes = {};

    try {
      switch (format) {
        case 'avif':
          base64 = await this.timeoutCompress(timeout, this.compressAndAssign(this.compressAVIF, { url, name, sourceType, outputType, mime, sizes }));
          base64Sizes = await this.timeoutCompress(timeout, this.compressAndAssignThumbs(this.compressAVIF, { name, sourceType, outputType, mime, sizes }, skipFull));
          break;
        case 'jpeg':
          base64 = await this.timeoutCompress(timeout, this.compressAndAssign(this.compressJPEG, { url, name, sourceType, outputType, mime, sizes }));
          base64Sizes = await this.timeoutCompress(timeout, this.compressAndAssignThumbs(this.compressJPEG, { name, sourceType, outputType, mime, sizes }, skipFull));
          break;
        case 'png':
          base64 = await  this.timeoutCompress(timeout, this.compressAndAssign(this.compressPNG, { url, name, sourceType, outputType, mime, sizes }));
          base64Sizes = await  this.timeoutCompress(timeout, this.compressAndAssignThumbs(this.compressPNG, { name, sourceType, outputType, mime, sizes }, skipFull));
          break;
        case 'webp':
          base64 = await this.timeoutCompress(timeout, this.compressAndAssign(this.compressWEBP, { url, name, sourceType, outputType, mime, sizes }));
          base64Sizes = await this.timeoutCompress(timeout, this.compressAndAssignThumbs(this.compressWEBP, { name, sourceType, outputType, mime, sizes }, skipFull));
          break;
      }

      return {
        'base64': base64,
        'base64Sizes': base64Sizes
      }
    } catch (error) {
      throw new Error(`Compression failed: ${error.message}`);
    }

  }

  handleUpload = async ({ attachment, base64, type = 'uncompressed', mediaIDs = [] }) => {

    const attachmentData = attachment.attributes;
    const url = attachmentData?.originalImageURL ?? attachmentData.url;
    const mime = attachmentData.mime;
    const filename = attachmentData?.originalImageName ?? attachmentData.filename;
    const attachmentID = attachmentData.id;
    const format = mime.split("/")[1];

    //console.log(attachmentData, 'attachmentData')

    const data = {
      action: 'squeeze_update_attachment',
      _ajax_nonce: this.nonce,
      filename: filename,
      type: 'image',
      format: format,
      base64: base64.base64,
      base64Sizes: base64.base64Sizes,
      attachmentID: attachmentID,
      url: url,
      process: type,
    }

    //console.log(data, 'squeeze_update_attachment')

    const uploadResponse = await jQuery.ajax({
      url: this.ajaxUrl, // + '111',
      type: 'POST',
      data: data,
    });

    if (type === 'uncompressed' || type === 'all' || type === 'path') {
      uploadResponse['mediaIDs'] = mediaIDs;
    }

    return uploadResponse;

  }

  handleBulkUpload = async (type = 'uncompressed', mediaIDs = []) => {
    let currentID;
    let attachment;

    switch (type) {
      case 'all':
      case 'uncompressed':
        currentID = mediaIDs[0];
        break;
      case 'path':
        currentID = mediaIDs[0]?.filename;
        break;
      default:
        currentID = 0;
        break;
    }

    if (type === 'path') {

      attachment = {
        attributes: {
          url: mediaIDs[0].url,
          mime: mediaIDs[0].mime,
          name: mediaIDs[0].name,
          filename: mediaIDs[0].filename,
          id: mediaIDs[0].id,
        }
      }

    } else {

      const attachmentResponse = await this.getAttachment(currentID);
      const attachmentData = attachmentResponse.data;

      console.log(attachmentData, 'attachmentData')

      attachment = {
        attributes: {
          url: attachmentData.url,
          mime: attachmentData.mime,
          name: attachmentData.name,
          filename: attachmentData.filename,
          id: attachmentData.id,
          sizes: attachmentData.sizes,
        }
      }

    }

    mediaIDs.shift();

    const mediaType = attachment.attributes.mime.split("/")[0];
    const mediaSubType = attachment.attributes.mime.split("/")[1];

    if (!this.maybeCompressAttachment(mediaType, mediaSubType)) {
      return {
        'mediaIDs': mediaIDs,
        'data': __('Skipped', 'squeeze')
      }
    }

    const compressData = await this.handleCompress( attachment );
    const uploadData = await this.handleUpload({ attachment: attachment, base64: compressData, type: type, mediaIDs: mediaIDs })

    return uploadData;


  }

  maybeCompressAttachment = (attachmentType, attachmentSubType) => {
    const allowedMimeTypes = ['jpeg', 'png', 'webp', 'avif'];
    const isImage = attachmentType === 'image' && allowedMimeTypes.includes(attachmentSubType)

    if (isImage) {
      return true;
    }

    return false;
  }

  handleRestore = async (attachmentID) => {
    const data = {
      action: 'squeeze_restore_attachment',
      _ajax_nonce: this.nonce,
      attachmentID: attachmentID,
    };

    const response = await jQuery.ajax({
      url: this.ajaxUrl,
      type: 'POST',
      data: data,
    });

    return response;
  };

  // Get list of attachments by path
  getAttachmentsByPath = async (path) => {

    const data = {
      action: 'squeeze_get_attachment_by_path',
      path: path,
      _ajax_nonce: this.nonce,
    }

    const response = jQuery.ajax({
      url: this.ajaxUrl,
      type: 'POST',
      data: data,
    });

    return response;
  }

  getAttachment = async (attachmentID) => {
    const data = {
      action: 'squeeze_get_attachment',
      _ajax_nonce: this.nonce,
      attachmentID: attachmentID,
    }

    const response = jQuery.ajax({
      url: this.ajaxUrl,
      type: 'POST',
      data: data,
    });

    return response;
  }


}