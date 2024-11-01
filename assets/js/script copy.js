import * as avif from '@jsquash/avif';
import * as webp from '@jsquash/webp';
import * as jpeg from '@jsquash/jpeg';
import * as png from '@jsquash/png';
import optimise from '@jsquash/oxipng/optimise';
import resize from '@jsquash/resize';
const { __ } = wp.i18n; // Import __() from wp.i18n

(function () {

  const bulkBtn = document.querySelector("input[name='squeeze_bulk']")
  const bulkAgainBtn = document.querySelector("input[name='squeeze_bulk_again']")
  const bulkPathBtn = document.querySelector("input[name='squeeze_bulk_path_button']")
  const squeeze_bulk_ids = document.querySelector("input[name='squeeze_bulk_ids']")?.value ?? null;
  const squeeze_bulk_all_ids = document.querySelector("input[name='squeeze_bulk_all_ids']")?.value ?? null;
  let uncompressedIDs = squeeze_bulk_ids ? squeeze_bulk_ids.split(",") : [];
  const allIDs = squeeze_bulk_all_ids ? squeeze_bulk_all_ids.split(",") : [];
  const postsFilterForm = document.querySelector("#posts-filter");
  let bulkPathData = [];

  async function decode(sourceType, fileBuffer) {
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

  async function encode(outputType, imageData) {
    const options = JSON.parse(squeeze.options);

    try {
      switch (outputType) {
        case 'avif':
          const avifOptions = {}
          for (const [key, value] of Object.entries(options)) {
            if (key.includes('avif')) {
              const keyName = key.replace('avif_', '')
              avifOptions[keyName] = value
            }
          }
          return await avif.encode(imageData, avifOptions);
        case 'jpeg':
          const jpegOptions = {}
          for (const [key, value] of Object.entries(options)) {
            if (key.includes('jpeg')) {
              const keyName = key.replace('jpeg_', '')
              jpegOptions[keyName] = value
            }
          }
          return await jpeg.encode(imageData, jpegOptions);
        case 'png':
          const pngOptions = {}
          for (const [key, value] of Object.entries(options)) {
            if (key.includes('png')) {
              const keyName = key.replace('png_', '')
              pngOptions[keyName] = value
            }
          }
          return await png.encode(imageData, pngOptions);
        case 'webp':
          const webpOptions = {}
          for (const [key, value] of Object.entries(options)) {
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
      console.error(error)
      return false;
    }

  }

  async function convert(sourceType, outputType, fileBuffer) {
    const imageData = await decode(sourceType, fileBuffer);
    return encode(outputType, imageData);
  }

  function blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  async function showOutput(imageBuffer, outputType) {
    if (!imageBuffer) {
      return false;
    }
    const imageBlob = new Blob([imageBuffer], { type: `image/${outputType}` });
    const base64String = await blobToBase64(imageBlob);

    return base64String;
  }

  const resizeImage = async ({sourceType, fileBuffer, outputType, resizeOptions, pngOptions}) => {
    if (outputType === 'png') {
      const optimisedPngBuffer = await optimise(fileBuffer, pngOptions);
      const imageData = await decode(outputType, optimisedPngBuffer);
      const resizedImageData = await resize(imageData, resizeOptions);
      return encode(outputType, resizedImageData);
    } else {
      const imageData = await decode(sourceType, fileBuffer);
      const resizedImageData = await resize(imageData, resizeOptions);
      return encode(outputType, resizedImageData);
    }
  }

  const compressJPEG = async ({url, name, sourceType, outputType, mime, resizeOptions}) => {
    let response = await fetch(url);
    let blob = await response.blob();
    let metadata = {
      type: mime
    };
    let imageObj = new File([blob], name, metadata);
    let imageBuffer;
    const fileBuffer = await imageObj.arrayBuffer();
    
    if (resizeOptions?.needResize) {
      imageBuffer = await resizeImage({sourceType, fileBuffer, outputType, resizeOptions});
    } else {
      imageBuffer = await convert(sourceType, outputType, fileBuffer);
    }

    const base64 = await showOutput(imageBuffer, outputType);
    return base64
  }

  const compressPNG = async ({url, options, outputType, resizeOptions}) => {
    let imageBuffer;
    const pngOptions = {}
    for (const [key, value] of Object.entries(options)) {
      if (key.includes('png')) {
        const keyName = key.replace('png_', '')
        pngOptions[keyName] = value
      }
    }
    if (resizeOptions?.needResize) {
      const pngImageBuffer = await fetch(url).then(res => res.arrayBuffer());
      imageBuffer = await resizeImage({fileBuffer: pngImageBuffer, outputType: outputType, resizeOptions: resizeOptions, pngOptions: pngOptions}); //TBD
    } else {
      imageBuffer = await fetch(url).then(res => res.arrayBuffer()).then(pngImageBuffer => optimise(pngImageBuffer, pngOptions));
    }
    
    const base64 = await showOutput(imageBuffer, outputType);
    return base64
  }

  const compressWEBP = async ({url, name, sourceType, outputType, mime, resizeOptions}) => {
    let webpResponse = await fetch(url);
    let webpBlob = await webpResponse.blob();
    let webpMetadata = {
      type: mime
    };
    let webpImageObj = new File([webpBlob], name, webpMetadata);
    let imageBuffer;
    const fileBuffer = await webpImageObj.arrayBuffer();
    if (resizeOptions?.needResize) {
      imageBuffer = await resizeImage({sourceType, fileBuffer, outputType, resizeOptions});
    } else {
      imageBuffer = await convert(sourceType, outputType, fileBuffer);
    }
    const base64 = await showOutput(imageBuffer, outputType);
    return base64
  }

  const compressAVIF = async ({url, name, sourceType, outputType, mime}) => {
    let avifResponse = await fetch(url);
    let avifBlob = await avifResponse.blob();
    let avifMetadata = {
      type: mime
    };
    let avifImageObj = new File([avifBlob], name, avifMetadata);
    let imageBuffer;
    const fileBuffer = await avifImageObj.arrayBuffer();
    if (resizeOptions?.needResize) {
      imageBuffer = await resizeImage({sourceType, fileBuffer, outputType, resizeOptions});
    } else {
      imageBuffer = await convert(sourceType, outputType, fileBuffer);
    }
    const base64 = await showOutput(imageBuffer, outputType);
    return base64
  }

  async function handleUpload({ attachment, isBulk = false, target = null, type = 'uncompressed' }) {
    const attachmentData = attachment.attributes;
    const url = attachmentData?.originalImageURL ?? attachmentData.url;
    const mime = attachmentData.mime;
    const name = attachmentData.name;
    const filename = attachmentData?.originalImageName ?? attachmentData.filename;
    const attachmentID = attachmentData.id;
    const format = mime.split("/")[1];
    const sourceType = format;
    const outputType = format;
    const options = JSON.parse(squeeze.options);
    const sizes = attachmentData.sizes;
    const compressThumbs = options.compress_thumbs;

    console.log(attachmentData, 'attachmentData')

    let base64;
    let base64Sizes = {};

    async function compressAndAssign(compressFunction, url, name, sourceType, outputType, mime, sizes, compressThumbs, base64Sizes) {
      let base64;
      const maxWidth = options.max_width;
      const maxHeight = options.max_height;
      const resizeOptions = {
        needResize: false,
        fitMethod: 'contain',
        width: maxWidth,
        height: maxHeight,
      };

      if (maxWidth || maxHeight) {
        const img = new Image();
        img.src = url;
        await new Promise((resolve) => {
          img.onload = () => {
            console.log(`Real width: ${img.width}, Real height: ${img.height}, URL: ${url}`);
            const aspectRatioHeight = img.height / img.width;
            const aspectRatioWidth = img.width / img.height;

            resizeOptions.width = img.width;
            resizeOptions.height = img.height;

            if (maxWidth && img.width > maxWidth) {
              resizeOptions.width = maxWidth;
              resizeOptions.height = maxWidth * aspectRatioHeight;
              resizeOptions.needResize = true;
            }

            if (maxHeight && img.height > maxHeight) {
              resizeOptions.height = maxHeight;
              resizeOptions.width = maxHeight * aspectRatioWidth;
              resizeOptions.needResize = true;
            }

            // Ensure both dimensions are within the max values
            if (resizeOptions.width > maxWidth) {
              resizeOptions.width = maxWidth;
              resizeOptions.height = maxWidth * aspectRatioHeight;
            }

            if (resizeOptions.height > maxHeight) {
              resizeOptions.height = maxHeight;
              resizeOptions.width = maxHeight / aspectRatioWidth;
            }
            
            console.log(resizeOptions, 'resizeOptions')
            resolve();
          };
        });
      }

      if (compressFunction === compressPNG) {
        base64 = await compressFunction({url, options, outputType, resizeOptions});
      } else {
        base64 = await compressFunction({url, name, sourceType, outputType, mime, resizeOptions});
      }

      if (!sizes) {
        return base64;
      }

      for (const [key, value] of Object.entries(sizes)) {
        if (!(key in compressThumbs)) {
          continue;
        }
        
        if (attachmentData.originalImageName === undefined && key === 'full') { // skip full size if no scaled image
          continue;
        }

        const sizeURL = value.url;
        const sizeWidth = value.width;
        const sizeHeight = value.height;
        const sizeName = `${name}-${sizeWidth}x${sizeHeight}`;
        let sizeBase64;
        
        if (compressFunction === compressPNG) {
          sizeBase64 = await compressFunction({url: sizeURL, options, outputType});
        } else {
          sizeBase64 = await compressFunction({url: sizeURL, name: sizeName, sourceType, outputType, mime});
        }

        Object.assign(base64Sizes, { [key]: {'url': sizeURL, 'base64': sizeBase64} });
      }
      return base64;
    }

    switch (format) {
      case 'avif':
        base64 = await compressAndAssign(compressAVIF, url, name, sourceType, outputType, mime, sizes, compressThumbs, base64Sizes);
        break;
      case 'jpeg':
        base64 = await compressAndAssign(compressJPEG, url, name, sourceType, outputType, mime, sizes, compressThumbs, base64Sizes);
        break;
      case 'png':
        base64 = await compressAndAssign(compressPNG, url, name, sourceType, outputType, mime, sizes, compressThumbs, base64Sizes);
        break;
      case 'webp':
        base64 = await compressAndAssign(compressWEBP, url, name, sourceType, outputType, mime, sizes, compressThumbs, base64Sizes);
        break;
    }

    if (!base64) {

      if (isBulk) {
        logMsg(__('An error has occured. Check the console for details.', 'squeeze'))
        logMsg(`===============================\r\n`)
        handleBulkUpload(type)
      } else {
        if (target) {
          target.closest("td").querySelector(".squeeze_status").innerHTML = __('An error has occured. Check the console for details.', 'squeeze')
          target.remove();
        }
      }

      return;
    }

    let data = {
      action: 'squeeze_update_attachment',
      _ajax_nonce: squeeze.nonce,
      filename: filename,
      type: 'image',
      format: format,
      base64: base64,
      base64Sizes: base64Sizes,
      attachmentID: attachmentID,
      url: url,
      process: type,
    }

    jQuery.ajax({
      url: squeeze.ajaxUrl,
      type: 'POST',
      data: data,
      beforeSend: function () {
        console.log(data, 'squeeze data')
        if (isBulk) {
          logMsg(`#${attachmentID}: ` + __('Compressed successfully, updating...', 'squeeze'))
        }
      },
      error: function (error) {
        console.error(error)
        if (target) {
          target.closest("td").querySelector(".squeeze_status").innerHTML = __('An error has occured. Check the console for details.', 'squeeze')
          target.remove();
        }
      },
      success: function (response) {
        if (isBulk) {
          if (response.success) {
            logMsg(`#${attachmentID}: ` + __('Updated successfully', 'squeeze') + `\r\n===============================\r\n`);
          } else {
            logMsg(`#${attachmentID}: ` + response.data + `\r\n===============================\r\n`);
          }
          handleBulkUpload(type) // continue bulk process
        }
        if (!isBulk && target) { // on single attachment compress

          target.closest("td").querySelector(".squeeze_status").innerHTML = response.data;

          if (target.closest("td").classList.contains("field")) { // grid mode
            const td = document.createElement("td");
            td.classList.add("field");
            td.style.width = "100%";
            td.appendChild(target.closest("td").querySelector(".squeeze_status .squeeze-comparison-table"));
            target.closest("tr").appendChild(td);
          }

          target.remove();
          window.onbeforeunload = null;
        }
        if (!target && !isBulk) { // on upload process
          attachment.set('uploading', false) // resume uploading process
        }
      }
    });

  }

  const handleBulkUpload = (type = 'uncompressed') => {
    let currentID;
    switch (type) {
      case 'uncompressed':
        currentID = uncompressedIDs[0];
        break;
      case 'all':
        currentID = allIDs[0];
        break;
      case 'path':
        currentID = bulkPathData[0]?.filename;
        break;
      default:
        currentID = 0;
        break;
    }
    const data = {
      action: 'squeeze_get_attachment',
      _ajax_nonce: squeeze.nonce,
      attachmentID: currentID,
    }

    if (type === 'uncompressed') {
      if (uncompressedIDs.length === 0) {
        alert(__('All images have been compressed!', 'squeeze'))
        //restoreBulkButtons() // TBD
        window.onbeforeunload = null;
        if (postsFilterForm) {
          postsFilterForm.dataset.action = 'squeeze_bulk_compressed';
          postsFilterForm.submit();
        } else {
          location.reload();
        }
        return;
      }
    } else if (type === 'all') {
      if (allIDs.length === 0) {
        alert(__('All images have been re-compressed again!', 'squeeze'))
        restoreBulkButtons()
        //location.reload();
        return;
      }
    } else if (type === 'path') {
      if (bulkPathData.length === 0) {
        alert(__('All images have been compressed!', 'squeeze'))
        restoreBulkButtons()
        //location.reload();
        return;
      }
    }

    logMsg(`attachment #${currentID}: start compressing...`)

    if (type === 'path') {

      const attachment = {
        attributes: {
          url: bulkPathData[0].url,
          mime: bulkPathData[0].mime,
          name: bulkPathData[0].name,
          filename: bulkPathData[0].filename,
          id: bulkPathData[0].id,
        }
      }
      bulkPathData.shift();
      handleUpload({ attachment, isBulk: true, type: type })

    } else {

      jQuery.ajax({
        url: squeeze.ajaxUrl,
        type: 'POST',
        data: data,
        error: function (error) {
          console.error(error)
        },
        success: function (response) {
          if (response.success) {
            const responseData = response.data;
            const attachment = {
              attributes: {
                url: responseData.url,
                mime: responseData.mime,
                name: responseData.name,
                filename: responseData.filename,
                id: responseData.id,
                sizes: responseData.sizes,
              }
            }

            if (type === 'uncompressed') {
              uncompressedIDs.shift();
            } else if (type === 'all') {
              allIDs.shift();
            }
            console.log(attachment, 'attachment')
            handleUpload({ attachment, isBulk: true, type: type })
          } else {
            console.error(response.data)
          }
        }
      });

    }
  }

  function handleRestore(attachmentID, target) {
    let data = {
      action: 'squeeze_restore_attachment',
      _ajax_nonce: squeeze.nonce,
      attachmentID: attachmentID,
    }

    jQuery.ajax({
      url: squeeze.ajaxUrl,
      type: 'POST',
      data: data,
      beforeSend: function () {
        target.disabled = true;
        target.innerText = __('Restore in process...', 'squeeze')
      },
      error: function (error) {
        console.error(error)
        target.closest("td").querySelector(".squeeze_status").innerHTML = __('An error has occured. Check the console for details.', 'squeeze')
        target.remove();
      },
      success: function (response) {
        target.closest("td").querySelector(".squeeze_status").innerHTML = response.data; //__('Restored successfully', 'squeeze')
        target.remove();
        window.onbeforeunload = null;
      }
    });
  }

  // Handle single compress button click
  const handleSingleBtnClick = (event) => {
    const attachmentID = event.target.dataset.attachment;

    wp?.media?.attachment(attachmentID).fetch().then(function (data) {
      const attachment = {
        attributes: data
      }
      handleUpload({ attachment, target: event.target })
    });
  }

  // Handle restore button click
  const handleRestoreBtnClick = (event) => {
    const attachmentID = event.target.dataset.attachment;
    handleRestore(attachmentID, event.target)
  }

  // Handle bulk path button click
  const handlePathUpload = (path) => {

    const data = {
      action: 'squeeze_get_attachment_by_path',
      path: path,
      _ajax_nonce: squeeze.nonce,
    }

    jQuery.ajax({
      url: squeeze.ajaxUrl,
      type: 'POST',
      data: data,
      error: function (error) {
        console.error(error)
      },
      success: function (response) {
        if (response.success) {
          const responseData = response.data;
          bulkPathData = responseData;
          handleBulkUpload('path')
        } else {
          console.error(response.data)
          logMsg(response.data)
          restoreBulkButtons()
        }
      }
    });
  }

  /**
   * Handle single buttons click
   */
  function handleSingleButtonsClick() {
    document.addEventListener("click", (e) => {
      //console.log(e.target, 'e.target')
      const singleBtnName = 'squeeze_compress_single';
      const compressAgainBtnName = 'squeeze_compress_again';
      const restoreBtnName = 'squeeze_restore';
      if (e.target.getAttribute("name") === singleBtnName || e.target.getAttribute("name") === compressAgainBtnName) {
        e.target.disabled = true;

        if (e.target.getAttribute("name") === compressAgainBtnName) {
          e.target.closest('td').querySelector(`[name='${restoreBtnName}']`).disabled = true;
        }

        e.target.innerText = __('Compressing...', 'squeeze')
        window.onbeforeunload = handleOnLeave;
        handleSingleBtnClick(e)
      }
      if (e.target.getAttribute("name") === restoreBtnName) {
        e.target.disabled = true;
        e.target.closest('td').querySelector(`[name='${compressAgainBtnName}']`).disabled = true;
        window.onbeforeunload = handleOnLeave;
        handleRestoreBtnClick(e)
      }
    })
  }

  handleSingleButtonsClick()

  function logMsg(msg) {
    const bulkLogInput = document.querySelector("[name='squeeze_bulk_log']")
    if (!bulkLogInput) {
      return;
    }
    bulkLogInput.value += msg + `\r\n`;
  }

  function restoreBulkButtons() {
    bulkBtn.disabled = false;
    bulkAgainBtn.disabled = false;
    bulkPathBtn.disabled = false;
    window.onbeforeunload = null;
  }

  /**
   * Handle bulk button click
   */
  bulkBtn?.addEventListener("click", (event) => {
    if (uncompressedIDs.length === 0) {
      return;
    }

    bulkBtn.disabled = true;
    bulkAgainBtn.disabled = true;
    bulkPathBtn.disabled = true;
    handleBulkUpload('uncompressed')
    window.onbeforeunload = handleOnLeave;
  })

  /**
   * Handle bulk again button click
   */
  bulkAgainBtn?.addEventListener("click", (event) => {
    bulkBtn.disabled = true;
    bulkAgainBtn.disabled = true;
    bulkPathBtn.disabled = true;
    handleBulkUpload('all')
    window.onbeforeunload = handleOnLeave;
  })

  /**
   * Handle bulk path button click
   */
  bulkPathBtn?.addEventListener("click", (event) => {
    const path = document.querySelector("input[name='squeeze_bulk_path']").value;

    if (!path) {
      alert(__('Please enter a valid path!', 'squeeze'))
      return;
    }

    bulkBtn.disabled = true;
    bulkAgainBtn.disabled = true;
    bulkPathBtn.disabled = true;
    handlePathUpload(path)
    window.onbeforeunload = handleOnLeave;
  })

  postsFilterForm?.addEventListener("submit", (event) => {
    const dataAction = postsFilterForm.dataset.action;
    const action = event.target.querySelector("select[name='action']").value;

    if (action === 'squeeze_bulk_compress' && dataAction !== 'squeeze_bulk_compressed') {
      event.preventDefault();
      const mediaList = document.querySelectorAll("input[name='media[]']:checked");
      uncompressedIDs = Array.from(mediaList).map((el) => el.value);
      handleBulkUpload('uncompressed')
      window.onbeforeunload = handleOnLeave;
    }
  })

  // https://wordpress.stackexchange.com/a/131295/186146 - override wp.Uploader.prototype.success
  jQuery.extend(wp?.Uploader?.prototype, {
    success: function (attachment) {
      //console.log(attachment, 'success');
      const options = JSON.parse(squeeze.options);
      const isAutoCompress = options.auto_compress;
      const allowedMimeTypes = ['jpeg', 'png', 'webp', 'avif'];
      let isImage = attachment.attributes.type === 'image' && allowedMimeTypes.includes(attachment.attributes.subtype)

      if (isImage && isAutoCompress) {
        // set 'uploading' param to true, to pause the uploading process
        window.onbeforeunload = handleOnLeave;
        attachment.set('uploading', true)
        handleUpload({ attachment })
      }
    },
  });

  /**
   * Hadnle warning on page leave
   */
  function handleOnLeave() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const isUploadPage =  window.location.href.includes('upload.php');

    if (page === 'squeeze-bulk') {
      return __('Are you sure you want to leave this page? The compression process will be terminated!', 'squeeze');
    }
    if (isUploadPage) {
      return __('Are you sure you want to leave this page? The settings will not be saved!', 'squeeze');
    }
  };

})();

//console.log(JSON.parse(squeeze.options), 'squeeze.options')