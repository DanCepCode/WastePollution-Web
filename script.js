const SITE_CONFIG = {
  surveyUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdRl4rcpv2xqYNlBPoExUbd5RwTXYbgsKA8N38jYW_tMAZGNA/viewform",
  supabaseUrl: "https://mhdylerbuzketvbypmtq.supabase.co",
  supabasePublishableKey: "sb_publishable_G8uufBe0atNLtxbsqh-BtQ__gdjmXok",
  photoBucket: "clean-up-photos",
};

const surveyLink = document.querySelector("#survey-link");
surveyLink.href = SITE_CONFIG.surveyUrl;
surveyLink.target = "_blank";
surveyLink.rel = "noopener noreferrer";

const form = document.querySelector("#photo-form");
const input = document.querySelector("#photo-input");
const consent = document.querySelector("#photo-consent");
const publishButton = document.querySelector("#publish-button");
const drop = document.querySelector("#upload-drop");
const caption = document.querySelector("#photo-caption");
const grid = document.querySelector("#photo-grid");
const empty = document.querySelector("#wall-empty");
const count = document.querySelector("#photo-count");
const status = document.querySelector("#photo-status");
let selectedFile = null;

const supabaseClient = window.supabase?.createClient(
  SITE_CONFIG.supabaseUrl,
  SITE_CONFIG.supabasePublishableKey,
);

function updateButton() {
  publishButton.disabled = !(selectedFile && consent.checked);
}

function showMessage(message, kind = "") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function safeImageExtension(file) {
  const allowedTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return allowedTypes[file.type] || null;
}

function renderPhoto(photo) {
  const { data } = supabaseClient.storage
    .from(SITE_CONFIG.photoBucket)
    .getPublicUrl(photo.storage_path);

  const card = document.createElement("article");
  card.className = "wall-item";
  const image = document.createElement("img");
  image.src = data.publicUrl;
  image.alt = photo.caption || "A community clean-up moment";
  image.loading = "lazy";
  card.append(image);
  if (photo.caption) {
    const description = document.createElement("p");
    description.textContent = photo.caption;
    card.append(description);
  }
  grid.append(card);
}

async function loadGallery() {
  if (!supabaseClient) {
    count.textContent = "PHOTO WALL UNAVAILABLE";
    showMessage("The photo wall could not connect to its image store.", "error");
    return;
  }

  const { data, error } = await supabaseClient
    .from("community_photos")
    .select("id, storage_path, caption, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    count.textContent = "PHOTO WALL SETUP IN PROGRESS";
    showMessage("The public photo wall is not ready yet. Please check back soon.", "error");
    return;
  }

  grid.querySelectorAll(".wall-item").forEach(card => card.remove());
  data.forEach(renderPhoto);
  empty.hidden = data.length > 0;
  count.textContent = data.length
    ? `${data.length} ${data.length === 1 ? "MOMENT" : "MOMENTS"}`
    : "YOUR MOMENTS WILL APPEAR HERE";
}

input.addEventListener("change", () => {
  const file = input.files?.[0];
  if (!file) return;

  if (!safeImageExtension(file)) {
    showMessage("Please choose a JPG, PNG, or WEBP image.", "error");
    input.value = "";
    selectedFile = null;
    updateButton();
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    showMessage("That photo is over 8 MB. Please choose a smaller image.", "error");
    input.value = "";
    selectedFile = null;
    updateButton();
    return;
  }

  selectedFile = file;
  const previewUrl = URL.createObjectURL(file);
  drop.style.backgroundImage = `url("${previewUrl}")`;
  drop.classList.add("has-preview");
  drop.querySelector(".upload-title").textContent = file.name;
  drop.querySelector(".upload-subtitle").textContent = "Click to choose a different photo";
  showMessage("");
  updateButton();
});

consent.addEventListener("change", updateButton);

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!selectedFile || !consent.checked || !supabaseClient) return;

  publishButton.disabled = true;
  publishButton.firstChild.textContent = "Sharing your photo… ";
  showMessage("Uploading your photo…");

  const extension = safeImageExtension(selectedFile);
  const storagePath = `${crypto.randomUUID()}.${extension}`;
  const photoCaption = caption.value.trim().slice(0, 100);
  const { error: uploadError } = await supabaseClient.storage
    .from(SITE_CONFIG.photoBucket)
    .upload(storagePath, selectedFile, {
      cacheControl: "3600",
      contentType: selectedFile.type,
      upsert: false,
    });

  if (uploadError) {
    showMessage("We couldn’t upload that photo. Please try again in a moment.", "error");
    publishButton.innerHTML = 'Add to the photo wall <span aria-hidden="true">↗</span>';
    updateButton();
    return;
  }

  const { error: rowError } = await supabaseClient
    .from("community_photos")
    .insert({ storage_path: storagePath, caption: photoCaption });

  if (rowError) {
    showMessage("The photo uploaded but could not be added to the wall. Please contact the project team.", "error");
    publishButton.innerHTML = 'Add to the photo wall <span aria-hidden="true">↗</span>';
    updateButton();
    return;
  }

  await loadGallery();
  input.value = "";
  selectedFile = null;
  caption.value = "";
  consent.checked = false;
  drop.style.backgroundImage = "";
  drop.classList.remove("has-preview");
  drop.querySelector(".upload-title").textContent = "Choose a photo";
  drop.querySelector(".upload-subtitle").textContent = "JPG, PNG or WEBP · up to 8 MB";
  publishButton.innerHTML = 'Add to the photo wall <span aria-hidden="true">↗</span>';
  showMessage("Your photo is now on the wall. Thank you for taking part!", "success");
  updateButton();
});

loadGallery();
