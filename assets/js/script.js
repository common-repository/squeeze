import SQUEEZE from './squeeze.js';
const { __ } = wp.i18n; // Import __() from wp.i18n

const Squeze = new SQUEEZE(squeezeOptions);
const compressOptions = JSON.parse(squeezeOptions.options);

//console.log(squeezeOptions, 'Squeeze JS loaded!');

(function () {

  const bulkBtn = document.querySelector("input[name='squeeze_bulk']")
  const bulkAgainBtn = document.querySelector("input[name='squeeze_bulk_again']")
  const bulkPathBtn = document.querySelector("input[name='squeeze_bulk_path_button']")
  const postsFilterForm = document.querySelector("#posts-filter");

  let cachedMediaData = {
    isPaused: false,
  }

  // Event listener for squeezeToggle event
  document.addEventListener('squeezeToggle', (event) => {
    cachedMediaData['isPaused'] = event.detail.isPaused;
    cachedMediaData['process'] = event.detail.process;
    cachedMediaData['mediaIDs'] = event.detail.mediaIDs;

    //console.log('squeezeIsPaused', cachedMediaData['isPaused']);
  });

  const logMsg = (msg) => {
    const bulkLogInput = document.querySelector("[name='squeeze_bulk_log']")
    if (!bulkLogInput) {
      return;
    }
    bulkLogInput.innerHTML += msg + `<br>`;
  }

  const restoreBulkButtons = () => {
    bulkBtn.disabled = false;
    bulkAgainBtn.disabled = false;
    bulkPathBtn.disabled = false;
    bulkBtn.value = __('Optimise uncompressed images', 'squeeze');
    bulkAgainBtn.value = __('Re-Optimise all images', 'squeeze');
    bulkPathBtn.value = __('Optimise images from custom path', 'squeeze');
    bulkBtn.dataset.running = 'false';
    bulkAgainBtn.dataset.running = 'false';
    bulkPathBtn.dataset.running = 'false';

    cachedMediaData.process = '';
    cachedMediaData.mediaIDs = [];
  }

  const disableBulkButtons = () => {
    bulkBtn.disabled = true;
    bulkAgainBtn.disabled = true;
    bulkPathBtn.disabled = true;
  }

  const disableAllButtons = (buttons) => {
    if (!buttons) {
      return;
    }
    buttons.forEach((btn) => {
      btn.disabled = true;
    })
  }

  const removeAllButtons = (buttons) => {
    if (!buttons) {
      return;
    }
    buttons.forEach((btn) => {
      btn.remove();
    })
  }

  const handleBulkToggle = (event, process, mediaIDs) => {

    if (event.target.dataset.running === 'true') {
      event.target.dataset.running = 'false';
      event.target.value = '▶ ' + __('Resume squeezing', 'squeeze');
    } else {
      event.target.dataset.running = 'true';
      event.target.value = '⏸ ' + __('Pause squeezing', 'squeeze');
    }

    const isPaused = event.target.dataset.running === 'false' ? true : false;

    // Create and dispatch custom event
    const customEvent = new CustomEvent('squeezeToggle', {
      detail: {
        isPaused: isPaused,
        process: process,
        mediaIDs: mediaIDs
      }
    });
    document.dispatchEvent(customEvent);

    return isPaused;
  }

  /**
   * Hadnle warning on page leave
   */
  const handleOnLeave = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const isUploadPage = window.location.href.includes('upload.php');
    const isMediaNewPage = window.location.href.includes('media-new.php');
    const isAttachmentPage = window.location.href.includes('post.php') && urlParams.get('action') === 'edit';

    if (page === 'squeeze-bulk' || isMediaNewPage || isAttachmentPage) {
      return __('Are you sure you want to leave this page? The compression process will be terminated!', 'squeeze');
    }
    if (isUploadPage) {
      return __('Are you sure you want to leave this page? The settings will not be saved!', 'squeeze');
    }
  };

  // Handle single compress button click
  const handleSingleBtnClick = async (event) => {
    const attachmentID = event.target.dataset.attachment;
    const squeezeStatus = event.target.closest("td").querySelector(".squeeze_status");

    try {
      wp.media.attachment(attachmentID).fetch().then(async (data) => {
        const attachment = {
          attributes: data
        }

        try {
          const compressData = await Squeze.handleCompress(attachment)
          const response = await Squeze.handleUpload({ attachment: attachment, base64: compressData })

          //console.log(response, 'response');

          squeezeStatus.innerHTML = response.data;

          if (event.target.closest("td").classList.contains("field")) { // grid mode
            const td = document.createElement("td");
            td.classList.add("field");
            td.style.width = "100%";
            td.appendChild(event.target.closest("td").querySelector(".squeeze_status .squeeze-comparison-table"));
            event.target.closest("tr").appendChild(td);
          }
        } catch (error) {
          console.error(error);
          squeezeStatus.innerHTML = error;
        } finally {
          removeAllButtons(event.target.closest("td").querySelectorAll(`button`));
          window.onbeforeunload = null;
        }
      });
    } catch (error) {
      console.error(error);
      squeezeStatus.innerHTML = __('An error has occured. Check the console for details.', 'squeeze');
      event.target.remove();
    }

  }

  // Handle restore button click
  const handleRestoreBtnClick = async (event) => {
    const attachmentID = event.target.dataset.attachment;

    event.target.disabled = true;
    event.target.closest("td").querySelector(".squeeze_status").innerHTML = '⏳ ' + __('Restore in process...', 'squeeze');

    try {
      const response = await Squeze.handleRestore(attachmentID);
      //console.log(response, 'response');
      event.target.closest("td").querySelector(".squeeze_status").innerHTML = response.data; //__('Restored successfully', 'squeeze')
    } catch (error) {
      console.error(error);
      event.target.closest("td").querySelector(".squeeze_status").innerHTML = __('An error has occured. Check the console for details.', 'squeeze');
    } finally {
      event.target.closest('td').querySelector(`[name='squeeze_compress_again']`).disabled = false;
      event.target.remove();
      window.onbeforeunload = null;
    }
  };

  /**
   * Handle single buttons click
   */
  const handleButtonsClick = async (event) => {
    const singleBtnName = 'squeeze_compress_single';
    const compressAgainBtnName = 'squeeze_compress_again';
    const restoreBtnName = 'squeeze_restore';

    if (event.target.getAttribute("name") === singleBtnName || event.target.getAttribute("name") === compressAgainBtnName) {
      disableAllButtons(event.target.closest("td").querySelectorAll(`button`));
      event.target.closest("td").querySelector(".squeeze_status").innerHTML = '⏳ ' + __('Compressing...', 'squeeze')
      window.onbeforeunload = handleOnLeave;
      handleSingleBtnClick(event);
    }

    if (event.target.getAttribute("name") === restoreBtnName) {
      disableAllButtons(event.target.closest("td").querySelectorAll(`button`));
      window.onbeforeunload = handleOnLeave;
      handleRestoreBtnClick(event)
    }

  }

  const handleRecursiveUpload = async (path, data) => {

    //console.log(data, 'data');

    if (cachedMediaData['isPaused']) {
      window.onbeforeunload = null;
      logMsg('⏸⏸⏸⏸⏸⏸⏸⏸⏸')
      logMsg(__('Squeezing has been paused!'), 'squeeze')
      logMsg('⏸⏸⏸⏸⏸⏸⏸⏸⏸')
      return { success: false, data: 'Process has been paused!', mediaIDs: data };
    }

    const filename = data[0]?.filename ? data[0].filename : `ID #${data[0]}`;

    logMsg(`${filename}: start compressing...`)

    try {
      const response = await Squeze.handleBulkUpload(path, data);

      logMsg(`${filename}: ${response.data}`)
      logMsg('=====================')

      if (response.mediaIDs.length > 0) {
        return handleRecursiveUpload(path, response.mediaIDs);
      }

      return response;

    } catch (error) {
      console.error(error);
      logMsg(`${filename}: ${error}`)
      logMsg('=====================')

      if (data.length > 0) {
        return handleRecursiveUpload(path, data);
      } else {
        return { success: false, data: error, mediaIDs: [] };
      }
    }

  }

  document.addEventListener("click", (event) => {
    handleButtonsClick(event)
  })

  /**
   * Handle bulk button click
   */
  bulkBtn?.addEventListener("click", async (event) => {
    const squeeze_bulk_ids = document.querySelector("input[name='squeeze_bulk_ids']")?.value ?? null;
    let uncompressedIDs = squeeze_bulk_ids ? squeeze_bulk_ids.split(",") : [];

    if (uncompressedIDs.length === 0) {
      return;
    }

    disableBulkButtons()
    window.onbeforeunload = handleOnLeave;

    event.target.disabled = false;

    if (cachedMediaData['process'] === 'uncompressed' && cachedMediaData['mediaIDs'].length > 0) {
      uncompressedIDs = cachedMediaData['mediaIDs'];
    }

    const isPaused = handleBulkToggle(event, 'uncompressed', uncompressedIDs);

    //console.log(isPaused, 'isPaused');

    if (isPaused) {
      return;
    }

    try {
      const finalResponse = await handleRecursiveUpload('uncompressed', uncompressedIDs);

      //console.log(finalResponse, 'finalResponse');

      if (finalResponse?.mediaIDs) {
        if (finalResponse.mediaIDs.length === 0) {
          alert(__('All images have been processed!', 'squeeze'))
          window.onbeforeunload = null;
          restoreBulkButtons()
        }
      }
    } catch (error) {
      console.error(error);
      restoreBulkButtons()
      window.onbeforeunload = null;
      alert(__('An error has occured. Check the console for details.', 'squeeze'))
    }
  })

  /**
   * Handle bulk again button click
   */
  bulkAgainBtn?.addEventListener("click", async (event) => {
    const squeeze_bulk_all_ids = document.querySelector("input[name='squeeze_bulk_all_ids']")?.value ?? null;
    let allIDs = squeeze_bulk_all_ids ? squeeze_bulk_all_ids.split(",") : [];

    if (allIDs.length === 0) {
      return;
    }

    disableBulkButtons()
    window.onbeforeunload = handleOnLeave;

    event.target.disabled = false;

    if (cachedMediaData['process'] === 'all' && cachedMediaData['mediaIDs'].length > 0) {
      allIDs = cachedMediaData['mediaIDs'];
    }

    const isPaused = handleBulkToggle(event, 'all', allIDs);

    //console.log(isPaused, 'isPaused');

    if (isPaused) {
      return;
    }

    try {
      const finalResponse = await handleRecursiveUpload('all', allIDs);

      //console.log(finalResponse, 'finalResponse');

      if (finalResponse?.mediaIDs) {
        if (finalResponse.mediaIDs.length === 0) {
          alert(__('All images have been processed!', 'squeeze'))
          window.onbeforeunload = null;
          location.reload();
        }
      }
    } catch (error) {
      console.error(error);
      restoreBulkButtons()
      window.onbeforeunload = null;
      alert(__('An error has occured. Check the console for details.', 'squeeze'))
    }
  })

  /**
   * Handle bulk path button click
   */
  bulkPathBtn?.addEventListener("click", async (event) => {
    const path = document.querySelector("input[name='squeeze_bulk_path']").value;
    let bulkPathData;

    if (!path) {
      alert(__('Please enter a valid path!', 'squeeze'))
      return;
    }

    disableBulkButtons()
    window.onbeforeunload = handleOnLeave;

    if (cachedMediaData['process'] === 'path' && cachedMediaData['mediaIDs'].length > 0) {
      bulkPathData = cachedMediaData['mediaIDs'];
    } else {
      const pathData = await Squeze.getAttachmentsByPath(path)

      //console.log(pathData, 'pathData')

      if (pathData.success) {
        const responseData = pathData.data;
        bulkPathData = responseData;
      } else {
        console.error(pathData.data)
        logMsg(pathData.data)
        restoreBulkButtons()
        window.onbeforeunload = null;
      }

    }

    event.target.disabled = false;

    const isPaused = handleBulkToggle(event, 'path', bulkPathData);

    //console.log(isPaused, 'isPaused');

    if (isPaused) {
      return;
    }

    try {

      const finalResponse = await handleRecursiveUpload('path', bulkPathData);

      //console.log(finalResponse, 'finalResponse');

      if (finalResponse?.mediaIDs) {
        if (finalResponse.mediaIDs.length === 0) {
          alert(__('All images have been processed!', 'squeeze'))
          window.onbeforeunload = null;
          restoreBulkButtons()
        }
      }

    } catch (error) {
      console.error(error);
      restoreBulkButtons()
      window.onbeforeunload = null;
      alert(__('An error has occured. Check the console for details.', 'squeeze'))
    }

  })

  postsFilterForm?.addEventListener("submit", async (event) => {
    const dataAction = postsFilterForm.dataset.action;
    const action = event.target.querySelector("select[name='action']").value;

    if (action === 'squeeze_bulk_compress' && dataAction !== 'squeeze_bulk_compressed') {
      event.preventDefault();
      const mediaList = document.querySelectorAll("input[name='media[]']:checked");
      const uncompressedIDs = Array.from(mediaList).map((el) => el.value);

      if (uncompressedIDs.length === 0) {
        return;
      }

      window.onbeforeunload = handleOnLeave;
      uncompressedIDs.forEach((id) => {
        postsFilterForm.querySelectorAll(`#post-${id} .column-squeeze button`).forEach((btn) => {
          btn.disabled = true;
        })
        const squeezeStatusElement = postsFilterForm.querySelector(`#post-${id} .column-squeeze .squeeze_status`);
        if (squeezeStatusElement) {
          squeezeStatusElement.innerText = '⏳ ' + __('Compressing...', 'squeeze');
        }
      })

      try {
        const finalResponse = await handleRecursiveUpload('uncompressed', uncompressedIDs);

        //console.log(finalResponse, 'finalResponse');

        if (finalResponse?.mediaIDs) {
          if (finalResponse.mediaIDs.length === 0) {
            window.onbeforeunload = null;
            postsFilterForm.dataset.action = 'squeeze_bulk_compressed';
            postsFilterForm.submit();
          }
        }
      } catch (error) {
        console.error(error);
        window.onbeforeunload = null;
        postsFilterForm.querySelector(`#post-${id} .column-squeeze .squeeze_status`).innerText = __('An error has occured. Check the console for details.', 'squeeze')
        alert(__('An error has occured. Check the console for details.', 'squeeze'))
      }
    }
  })

  const maybeCompressAttachment = (attachmentType, attachmentSubType) => {
    const isAutoCompress = compressOptions.auto_compress;
    const allowedMimeTypes = ['jpeg', 'png', 'webp', 'avif'];
    const isImage = attachmentType === 'image' && allowedMimeTypes.includes(attachmentSubType)

    if (isImage && isAutoCompress) {
      return true;
    }

    return false;
  }

  // https://wordpress.stackexchange.com/a/131295/186146 - override wp.Uploader.prototype.success
  jQuery.extend(wp?.Uploader?.prototype, {
    success: async (attachment) => {
      //console.log(attachment, 'success');

      if (maybeCompressAttachment(attachment.attributes.type, attachment.attributes.subtype)) {

        // set 'uploading' param to true, to pause the uploading process
        window.onbeforeunload = handleOnLeave;
        attachment.set('uploading', true)
        attachment.set('percent', 100)

        // TBD: indicate that the image is being compressed

        const compressData = await Squeze.handleCompress(attachment)
        const uploadData = await Squeze.handleUpload({ attachment: attachment, base64: compressData })

        if (uploadData.success) {
          const compat = attachment.get('compat');
          const tempDiv = document.createElement('div');
          let compatItem = compat.item;

          tempDiv.innerHTML = compatItem;
          tempDiv.querySelector('.compat-field-squeeze_is_compressed .field').innerHTML = uploadData.data;
          compat.item = tempDiv.innerHTML;

          attachment.set('compat', compat)
          attachment.set('uploading', false)
          window.onbeforeunload = null;

        } else {
          attachment.set('uploading', false)
          window.onbeforeunload = null;
          alert(uploadData.data)
        }
      }
    },
  });

  const handleMultiFileFormUpload = () => {
    if (typeof wpUploaderInit === 'undefined' || typeof plupload === 'undefined' || typeof uploader === 'undefined') {
      return;
    }

    const SqueezeUploader = uploader;

    SqueezeUploader.bind('FilesAdded', function (up, files) {
      //console.log(files);
    });

    SqueezeUploader.bind('FileUploaded', function (up, file, response) {
      //console.log('FileUploaded', file);
      //console.log('response', response);

      const fileMime = file.type;
      const fileType = fileMime.split('/')[0];
      const fileSubType = fileMime.split('/')[1];

      if (!maybeCompressAttachment(fileType, fileSubType)) {
        return;
      }

      const fileID = file.id;
      const attachmentID = response.response;
      const mediaItem = document.getElementById(`media-item-${fileID}`);

      window.onbeforeunload = handleOnLeave;

      /**
       * Wait for media item to load( 'async-upload.php' )
       * Ping every 1 second until the media item is loaded
       * @returns Promise
       */
      const waitForItemLoad = () => {
        return new Promise((resolve, reject) => {
          let interval = setInterval(() => {
            if (mediaItem.querySelector('.media-item-wrapper')) {
              mediaItem.querySelector('.media-item-wrapper').innerHTML += `
                  <div class="progress">
                    <div class="percent">${__('Compressing...', 'squeeze')}</div>
                    <div class="bar" style="width: 200px;"></div>
                  </div>
                `;
              clearInterval(interval);
              resolve();
            }
          }, 1000);
        });
      }

      waitForItemLoad().then(() => {
        try {
          wp.media.attachment(attachmentID).fetch().then(async function (data) {

            const attachment = {
              attributes: data
            }

            const compressData = await Squeze.handleCompress(attachment)
            const uploadData = await Squeze.handleUpload({ attachment: attachment, base64: compressData })

            if (uploadData.success) {
              window.onbeforeunload = null;
              mediaItem.innerHTML += `<div class="squeeze_status">${uploadData.data}</div>`;
              mediaItem.querySelector('.progress')?.remove();
            } else {
              alert(uploadData.data)
              window.onbeforeunload = null;
              mediaItem.querySelector('.progress')?.remove();
            }

          });

        } catch (error) {
          console.error(error);
          mediaItem.innerHTML += __('An error has occured. Check the console for details.', 'squeeze');
          window.onbeforeunload = null;
          mediaItem.querySelector('.progress')?.remove();
        }

      });

    });

    SqueezeUploader.bind('UploadComplete', function (up, files) {
      //console.log('UploadComplete', files);
    });
  }

  document.onreadystatechange = function () { // equivalent to jQuery $(document).ready()
    if (document.readyState === "complete") {
      handleMultiFileFormUpload();
    }
  }


})();