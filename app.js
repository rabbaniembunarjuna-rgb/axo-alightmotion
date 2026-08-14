const mainForm = document.querySelector("#main-form");
const fieldLabelText = document.querySelector("#field-label-text");
const fieldIcon = document.querySelector("#field-icon");
const submitButton = document.querySelector("#submit-button");
const buttonText = document.querySelector("#button-text");
const notice = document.querySelector("#notice");
const guideEmail = document.querySelector("#guide-email");
const statusTitle = document.querySelector("#status-title");
const statusText = document.querySelector("#status-text");
const stepKicker = document.querySelector("#step-kicker");
const stepTitle = document.querySelector("#step-title");
const stepDescription = document.querySelector("#step-description");
const dotOne = document.querySelector("#dot-one");
const dotTwo = document.querySelector("#dot-two");

const channelModal = document.querySelector("#channel-modal");
const channelDescription = document.querySelector("#channel-description");
const botOnlyModal = document.querySelector("#bot-only-modal");
const successModal = document.querySelector("#success-modal");
const successMessage = document.querySelector("#success-message");
const successDone = document.querySelector("#success-done");

function openModal(modal) {
  if (!modal || modal.classList.contains("is-open")) return;

  modal.classList.remove("hidden", "is-closing");
  modal.setAttribute("aria-hidden", "false");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.classList.add("is-open");
      document.body.classList.add("modal-open");
    });
  });
}

function closeModal(modal) {
  if (!modal || !modal.classList.contains("is-open")) return Promise.resolve();

  modal.classList.remove("is-open");
  modal.classList.add("is-closing");

  return new Promise((resolve) => {
    window.setTimeout(() => {
      modal.classList.remove("is-closing");
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");

      const hasOpenModal = [...document.querySelectorAll(".modal-layer")]
        .some((item) => item.classList.contains("is-open"));

      if (!hasOpenModal) {
        document.body.classList.remove("modal-open");
      }

      resolve();
    }, 240);
  });
}

function openChannelModal(mode = "welcome") {
  if (channelDescription) {
    channelDescription.textContent = mode === "success"
      ? "Aktivasi sudah selesai. Ikuti saluran AXO untuk mendapatkan update layanan, fitur baru, dan pengumuman berikutnya."
      : "Dapatkan info update layanan, fitur baru, dan pengumuman penting langsung dari saluran WhatsApp.";
  }

  openModal(channelModal);
}

function openSuccessModal(message) {
  if (successMessage && message) {
    successMessage.textContent = message;
  }

  openModal(successModal);
}

async function openBotOnlyModal() {
  if (channelModal?.classList.contains("is-open")) {
    await closeModal(channelModal);
  }

  openModal(botOnlyModal);
}

document.querySelectorAll("[data-channel-close]").forEach((button) => {
  button.addEventListener("click", () => closeModal(channelModal));
});

document.querySelectorAll("[data-bot-only-close]").forEach((button) => {
  button.addEventListener("click", () => closeModal(botOnlyModal));
});

successDone?.addEventListener("click", async () => {
  await closeModal(successModal);
  await new Promise((resolve) => setTimeout(resolve, 140));
  openChannelModal("success");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (successModal?.classList.contains("is-open")) {
    closeModal(successModal);
    return;
  }

  if (botOnlyModal?.classList.contains("is-open")) {
    closeModal(botOnlyModal);
    return;
  }

  if (channelModal?.classList.contains("is-open")) {
    closeModal(channelModal);
  }
});


let stage = "send";
let activeEmail = "";

function currentInput() {
  return document.querySelector("#main-input");
}

function setNotice(type, message) {
  notice.className = "notice " + type;
  notice.textContent = String(message || "");
}

function clearNotice() {
  notice.className = "notice hidden";
  notice.textContent = "";
}

function setBusy(busy, label) {
  submitButton.disabled = busy;
  if (busy) {
    buttonText.textContent = label;
  } else {
    buttonText.textContent = stage === "send"
      ? "Kirim link verifikasi"
      : "Verifikasi sekarang";
  }
}

function getMessage(data, fallback) {
  if (!data || typeof data !== "object") return fallback;
  return data.message || data.result?.message || data.data?.message || fallback;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = {
      status: false,
      message: "Respons server tidak dapat dibaca."
    };
  }

  if (!response.ok || data?.status === false) {
    const error = new Error(getMessage(data, "Permintaan gagal diproses."));
    error.code = data?.code || data?.error?.code || data?.error || data?.data?.code || "";
    error.data = data;
    throw error;
  }

  return data;
}

function linkIcon() {
  fieldIcon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M9.5 14.5 14.5 9.5M8.1 16.7l-1.3 1.3a3.4 3.4 0 0 1-4.8-4.8l3-3a3.4 3.4 0 0 1 4.8 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="m15.9 7.3 1.3-1.3a3.4 3.4 0 1 1 4.8 4.8l-3 3a3.4 3.4 0 0 1-4.8 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
}

function switchToVerify(email) {
  stage = "verify";
  activeEmail = email;

  const oldInput = currentInput();
  const textarea = document.createElement("textarea");

  textarea.id = "main-input";
  textarea.name = "link";
  textarea.rows = 4;
  textarea.required = true;
  textarea.spellcheck = false;
  textarea.autocomplete = "off";
  textarea.placeholder = "Tempel seluruh link https://alight-creative...";

  oldInput.replaceWith(textarea);

  fieldLabelText.textContent = "Full link verifikasi";
  linkIcon();

  stepKicker.textContent = "Langkah 2 dari 2";
  stepTitle.textContent = "Tempel link verifikasi";
  stepDescription.textContent = "Salin seluruh link dari email lalu tempel di bawah.";
  buttonText.textContent = "Verifikasi sekarang";

  statusTitle.textContent = "Email berhasil dikirim";
  statusText.textContent = "Menunggu link verifikasi dari email.";

  dotOne.classList.remove("active");
  dotTwo.classList.add("active");

  guideEmail.textContent = "Email verifikasi sudah dikirim ke " + email + ".";
  guideEmail.classList.add("sent");


  setTimeout(() => {
    textarea.focus();
  }, 120);
}


function resetActivationForm() {
  stage = "send";
  activeEmail = "";

  const oldInput = currentInput();
  const input = document.createElement("input");

  input.id = "main-input";
  input.name = "email";
  input.type = "email";
  input.inputMode = "email";
  input.autocomplete = "email";
  input.maxLength = 254;
  input.placeholder = "nama@email.com";
  input.required = true;

  oldInput.replaceWith(input);

  fieldLabelText.textContent = "Email target";
  fieldIcon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 6.8h16v10.4H4z" stroke="currentColor" stroke-width="1.8"/>
      <path d="m5 8 7 5 7-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  stepKicker.textContent = "Langkah 1 dari 2";
  stepTitle.textContent = "Kirim email verifikasi";
  stepDescription.textContent = "Masukkan email yang digunakan untuk akun Alight Motion.";
  buttonText.textContent = "Kirim link verifikasi";

  statusTitle.textContent = "Layanan siap digunakan";
  statusText.textContent = "API terhubung dan menunggu permintaan.";

  dotTwo.classList.remove("active");
  dotOne.classList.add("active");

  guideEmail.textContent =
    "Setelah link dikirim, ikuti langkah berikut untuk menyelesaikan verifikasi.";
  guideEmail.classList.remove("sent");

  clearNotice();
  localStorage.removeItem("znn_am_email");
}

mainForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearNotice();

  if (stage === "send") {
    const email = currentInput().value.trim().toLowerCase();
    if (!email) return;

    setBusy(true, "Mengirim...");

    try {
      const data = await postJson("/api/send", { email });

      switchToVerify(email);

      setNotice(
        "success",
        getMessage(data, "Email verifikasi berhasil dikirim.")
      );
    } catch (error) {
      setNotice(
        "error",
        error.message || "Gagal mengirim email verifikasi."
      );
    } finally {
      setBusy(false);
    }

    return;
  }

  const link = currentInput().value.trim();
  if (!link || !activeEmail) return;

  setBusy(true, "Memverifikasi...");

  try {
    const data = await postJson("/api/verify", {
      email: activeEmail,
      link
    });

    const successText = getMessage(
      data,
      "Verifikasi berhasil. Premium sudah diproses."
    );

    setNotice("success", successText);

    statusTitle.textContent = "Verifikasi berhasil";
    statusText.textContent = "Permintaan aktivasi premium sudah diproses.";
    currentInput().value = "";

    localStorage.removeItem("znn_am_email");
    openSuccessModal(successText);

    setTimeout(() => {
      resetActivationForm();
    }, 350);
  } catch (error) {
    setNotice(
      "error",
      error.message || "Verifikasi gagal diproses."
    );
  } finally {
    setBusy(false);
  }
});



window.addEventListener("load", () => {
  setTimeout(() => {
    openChannelModal("welcome");
  }, 650);
});

const mainToggle = document.querySelector("#main-toggle");
const bulkToggle = document.querySelector("#bulk-toggle");
const inboxToggle = document.querySelector("#inbox-toggle");
const toolsPanel = document.querySelector("#tools-panel");
const toolsClose = document.querySelector("#tools-close");
const toolsTitle = document.querySelector("#tools-title");
const toolsDescription = document.querySelector("#tools-description");
const bulkPanel = document.querySelector("#bulk-panel");
const inboxPanel = document.querySelector("#inbox-panel");
const activationCard = document.querySelector("#activation-card");
const guideCard = document.querySelector("#guide-card");
const heroEyebrow = document.querySelector("#hero-eyebrow");
const heroTitle = document.querySelector("#hero-title");
const heroDescription = document.querySelector("#hero-description");

const bulkForm = document.querySelector("#bulk-form");
const bulkAmount = document.querySelector("#bulk-amount");
const bulkSubmit = document.querySelector("#bulk-submit");
const bulkButtonText = document.querySelector("#bulk-button-text");
const bulkNotice = document.querySelector("#bulk-notice");
const bulkResults = document.querySelector("#bulk-results");
const bulkLimitHelp = document.querySelector("#bulk-limit-help");

const inboxForm = document.querySelector("#inbox-form");
const inboxEmail = document.querySelector("#inbox-email");
const inboxSubmit = document.querySelector("#inbox-submit");
const inboxButtonText = document.querySelector("#inbox-button-text");
const inboxNotice = document.querySelector("#inbox-notice");
const inboxResults = document.querySelector("#inbox-results");

let activeTool = "bulk";
let lastToolToggle = bulkToggle;
let bulkStatus = null;
let bulkStatusLoading = false;

function effectiveBulkMax(status) {
  if (!status) return 100;
  const maximum = Math.max(0, Number(status.bulk_max) || 0);
  if (status.unlimited_daily) return maximum;
  const remaining = Math.max(0, Number(status.bulk_remaining_today) || 0);
  return Math.min(maximum, remaining);
}

function applyBulkStatus(status) {
  bulkStatus = status;
  const maximum = effectiveBulkMax(status);
  bulkAmount.max = String(Math.max(1, maximum));
  if (Number(bulkAmount.value) > maximum && maximum > 0) bulkAmount.value = String(maximum);
  bulkSubmit.disabled = maximum === 0;

  if (maximum === 0) {
    bulkLimitHelp.textContent = "Kuota Bulk Web hari ini habis.";
    setToolNotice(bulkNotice, "error", "Kuota Bulk Web hari ini habis.");
    openBotOnlyModal();
  } else if (status.unlimited_daily) {
    bulkLimitHelp.textContent = `Maksimal ${maximum} akun per request • tanpa limit harian.`;
  } else {
    bulkLimitHelp.textContent = `Maksimal ${maximum} akun saat ini • sisa ${status.bulk_remaining_today} hari ini.`;
  }
}

async function fetchBulkStatus() {
  if (bulkStatusLoading) return;
  bulkStatusLoading = true;
  bulkLimitHelp.textContent = "Memuat limit Bulk...";

  try {
    const response = await fetch("/api/bulk-status", { headers: { accept: "application/json" } });
    const data = await response.json();
    if (!response.ok || data?.status === false) throw new Error();
    applyBulkStatus(data);
  } catch {
    bulkStatus = null;
    bulkAmount.max = "100";
    bulkSubmit.disabled = false;
    bulkLimitHelp.textContent = "Status limit sementara tidak tersedia. Server tetap memeriksa setiap request.";
  } finally {
    bulkStatusLoading = false;
  }
}

function setActiveNavigation(active) {
  const onMain = active === "main";
  const onBulk = active === "bulk";
  const onInbox = active === "inbox";

  mainToggle.classList.toggle("active", onMain);
  bulkToggle.classList.toggle("active", onBulk);
  inboxToggle.classList.toggle("active", onInbox);

  mainToggle.toggleAttribute("aria-current", onMain);
  bulkToggle.setAttribute("aria-expanded", String(onBulk));
  inboxToggle.setAttribute("aria-expanded", String(onInbox));
}

function setHero(view) {
  if (view === "bulk") {
    heroEyebrow.textContent = "ALIGHT MOTION BULK";
    heroTitle.textContent = "Bulk Email";
    heroDescription.textContent = "Buat beberapa email Alight Motion yang Premium-nya langsung aktif dan siap dipakai.";
    return;
  }

  if (view === "inbox") {
    heroEyebrow.textContent = "TEMP MAIL";
    heroTitle.textContent = "Baca Email";
    heroDescription.textContent = "Ambil link Alight Motion dari pesan terbaru pada alamat email yang kamu masukkan.";
    return;
  }

  heroEyebrow.textContent = "ALIGHT MOTION";
  heroTitle.textContent = "Aktivasi Premium";
  heroDescription.textContent = "Kirim link verifikasi ke email, lalu selesaikan aktivasi dari satu halaman.";
}

function showMain(scroll = true) {
  toolsPanel.classList.add("hidden");
  activationCard.classList.remove("hidden");
  guideCard.classList.remove("hidden");
  setActiveNavigation("main");
  setHero("main");

  if (scroll) {
    window.setTimeout(() => {
      document.querySelector(".hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }
}

function showTools(tab = "bulk", scroll = true) {
  activationCard.classList.add("hidden");
  guideCard.classList.add("hidden");
  toolsPanel.classList.remove("hidden");
  selectToolTab(tab);
  if (tab === "bulk") fetchBulkStatus();

  if (scroll) {
    window.setTimeout(() => {
      toolsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }
}

function hideTools() {
  showMain();
  mainToggle?.focus({ preventScroll: true });
}

function selectToolTab(name) {
  const selected = name === "inbox" ? "inbox" : "bulk";
  activeTool = selected;

  const bulkActive = selected === "bulk";
  setActiveNavigation(selected);
  setHero(selected);

  bulkPanel.classList.toggle("hidden", selected !== "bulk");
  inboxPanel.classList.toggle("hidden", selected !== "inbox");

  toolsTitle.textContent = bulkActive ? "Bulk email" : "Baca email terbaru";
  toolsDescription.textContent = bulkActive
    ? "Buat beberapa email Alight Motion yang Premium-nya langsung aktif."
    : "Masukkan alamat email untuk mengambil link Alight Motion dari pesan paling baru.";
}

mainToggle?.addEventListener("click", () => {
  showMain();
});

bulkToggle?.addEventListener("click", () => {
  lastToolToggle = bulkToggle;
  showTools("bulk");
});

inboxToggle?.addEventListener("click", () => {
  lastToolToggle = inboxToggle;
  showTools("inbox");
});

toolsClose?.addEventListener("click", hideTools);

function setToolNotice(element, type, message) {
  element.className = "notice " + type;
  element.textContent = String(message || "");
}

function clearToolNotice(element) {
  element.className = "notice hidden";
  element.textContent = "";
}

function setToolBusy(button, textElement, busy, busyText, idleText) {
  button.disabled = busy;
  textElement.textContent = busy ? busyText : idleText;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function collectEmails(value, output = [], depth = 0) {
  if (depth > 8 || value == null) return output;

  if (typeof value === "string") {
    const matches = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    matches.forEach((email) => {
      const normalized = email.toLowerCase();
      if (!output.includes(normalized)) output.push(normalized);
    });
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectEmails(item, output, depth + 1));
    return output;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectEmails(item, output, depth + 1));
  }

  return output;
}

async function copyText(value, button) {
  const text = String(value || "");
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  if (!button) return;
  const oldText = button.textContent;
  button.textContent = "Tersalin";
  window.setTimeout(() => {
    button.textContent = oldText;
  }, 1200);
}

function createResultsHead(title, detail) {
  const head = document.createElement("div");
  head.className = "results-head";

  const strong = document.createElement("strong");
  strong.textContent = title;

  const span = document.createElement("span");
  span.textContent = detail;

  head.append(strong, span);
  return head;
}

function bulkFilename() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return "alightmotion-bulk-" +
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) + "-" +
    pad(now.getHours()) +
    pad(now.getMinutes()) + ".txt";
}

function downloadBulkFile(emails) {
  const content = emails.join("\n") + "\n";
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = bulkFilename();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderBulkResults(data, requestedAmount) {
  bulkResults.replaceChildren();
  const emails = collectEmails(data?.result ?? data?.data ?? data);
  const declaredAmount = Number(
    data?.amount ?? data?.count ?? data?.data?.count ?? data?.result?.count
  );
  const resultCount = Number.isFinite(declaredAmount) && declaredAmount >= 0
    ? declaredAmount
    : emails.length;

  bulkResults.append(
    createResultsHead(
      "Email Premium siap dipakai",
      resultCount + (resultCount === 1 ? " email Premium" : " email Premium")
    )
  );

  if (!emails.length) {
    const raw = document.createElement("pre");
    raw.className = "raw-result";
    raw.textContent = JSON.stringify(data?.result ?? data?.data ?? data, null, 2);
    bulkResults.append(raw);
    bulkResults.classList.remove("hidden");
    return;
  }

  if (requestedAmount > 10) {
    const downloadCard = document.createElement("div");
    downloadCard.className = "bulk-download-card";

    const title = document.createElement("strong");
    title.textContent = "Hasil disiapkan sebagai file TXT";

    const description = document.createElement("span");
    description.textContent = emails.length + " email Premium akan ditulis satu per baris.";

    const downloadButton = document.createElement("button");
    downloadButton.className = "download-button";
    downloadButton.type = "button";
    downloadButton.textContent = "Download hasil .txt";
    downloadButton.addEventListener("click", () => downloadBulkFile(emails));

    downloadCard.append(title, description, downloadButton);
    bulkResults.append(downloadCard);
    bulkResults.classList.remove("hidden");
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "bulk-result-toolbar";

  const copyAllButton = document.createElement("button");
  copyAllButton.className = "result-button";
  copyAllButton.type = "button";
  copyAllButton.textContent = "Salin semua";
  copyAllButton.addEventListener("click", () => {
    copyText(emails.join("\n"), copyAllButton);
  });

  toolbar.append(copyAllButton);
  bulkResults.append(toolbar);

  const list = document.createElement("div");
  list.className = "email-results";

  emails.forEach((email, index) => {
    const item = document.createElement("div");
    item.className = "email-result";

    const copy = document.createElement("div");
    copy.className = "email-result-copy";

    const value = document.createElement("strong");
    value.textContent = email;

    const label = document.createElement("span");
    label.textContent = "Email " + (index + 1);

    copy.append(value, label);

    const actions = document.createElement("div");
    actions.className = "result-actions";

    const copyButton = document.createElement("button");
    copyButton.className = "result-button secondary";
    copyButton.type = "button";
    copyButton.textContent = "Salin";
    copyButton.addEventListener("click", () => copyText(email, copyButton));

    actions.append(copyButton);
    item.append(copy, actions);
    list.append(item);
  });

  bulkResults.append(list);
  bulkResults.classList.remove("hidden");
}

function firstString(value, keys) {
  if (!value || typeof value !== "object") return "";

  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) return item.trim();
    if (typeof item === "number") return String(item);
  }

  return "";
}

function stripHtml(value) {
  const text = String(value || "");
  if (!/<[a-z][\s\S]*>/i.test(text)) return text.trim();

  const parsed = new DOMParser().parseFromString(text, "text/html");
  return String(parsed.body?.textContent || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function validHttpUrl(value) {
  try {
    const url = new URL(String(value || "").replace(/&amp;/g, "&"));
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function collectLinks(value, output = [], depth = 0) {
  if (depth > 6 || value == null) return output;

  if (typeof value === "string") {
    const urls = value.match(/https?:\/\/[^\s<>"']+/gi) || [];
    urls.forEach((item) => {
      const url = validHttpUrl(item.replace(/[),.;]+$/, ""));
      if (url && !output.includes(url)) output.push(url);
    });
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectLinks(item, output, depth + 1));
    return output;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectLinks(item, output, depth + 1));
  }

  return output;
}

function normalizeMessages(data) {
  const payload = data?.data ?? data?.result ?? data ?? {};
  const source = payload?.messages ?? payload?.inbox ?? payload?.mails ?? [];

  if (Array.isArray(source)) return source.filter(Boolean);

  if (source && typeof source === "object") {
    const messageKeys = ["subject", "title", "body", "text", "html", "from", "sender"];
    if (messageKeys.some((key) => Object.prototype.hasOwnProperty.call(source, key))) {
      return [source];
    }

    return Object.values(source).filter(
      (item) => item && typeof item === "object"
    );
  }

  return [];
}

function messageLinks(message, body) {
  const preferred = [
    message?.login_url,
    message?.loginUrl,
    message?.verification_url,
    message?.verificationUrl,
    message?.link,
    message?.url
  ];
  const output = [];

  preferred.forEach((item) => {
    const url = validHttpUrl(item);
    if (url && !output.includes(url)) output.push(url);
  });

  collectLinks(message?.links, output);
  collectLinks(body, output);
  return output;
}

function newestMessage(messages) {
  if (!messages.length) return null;

  return messages.reduce((latest, message) => {
    const latestDate = Date.parse(firstString(latest, [
      "received", "date", "received_at", "receivedAt", "created_at", "createdAt", "time"
    ]));
    const messageDate = Date.parse(firstString(message, [
      "received", "date", "received_at", "receivedAt", "created_at", "createdAt", "time"
    ]));

    if (Number.isFinite(messageDate) && (!Number.isFinite(latestDate) || messageDate > latestDate)) {
      return message;
    }

    return latest;
  }, messages[0]);
}

function latestAlightLink(message) {
  if (!message) return "";

  const bodyValue = firstString(message, [
    "text", "plain", "message", "body", "content", "textBody", "htmlBody", "html"
  ]);
  const links = messageLinks(message, bodyValue);

  return links.find((url) => /alight-creative|alightcreative/i.test(url)) || "";
}

function createLatestLinkCard(message, link) {
  const card = document.createElement("article");
  card.className = "message-card";

  const topline = document.createElement("div");
  topline.className = "message-topline";

  const title = document.createElement("h3");
  title.className = "message-title";
  title.textContent = firstString(message, ["subject", "title", "topic"]) || "Pesan terbaru";

  const badge = document.createElement("span");
  badge.className = "message-number";
  badge.textContent = "AM";

  topline.append(title, badge);
  card.append(topline);

  const from = firstString(message, [
    "from", "sender", "from_address", "fromAddress", "sender_email", "senderEmail"
  ]);
  const received = firstString(message, [
    "received", "date", "received_at", "receivedAt", "created_at", "createdAt", "time"
  ]);

  if (from || received) {
    const meta = document.createElement("div");
    meta.className = "message-meta";

    if (from) {
      const line = document.createElement("span");
      line.textContent = "Dari: " + from;
      meta.append(line);
    }

    if (received) {
      const line = document.createElement("span");
      line.textContent = "Waktu: " + received;
      meta.append(line);
    }

    card.append(meta);
  }

  const row = document.createElement("div");
  row.className = "message-link login-link";

  const copy = document.createElement("div");
  copy.className = "message-link-copy";

  const label = document.createElement("strong");
  label.textContent = "Login ke Alight Creative";

  const preview = document.createElement("span");
  preview.textContent = link;
  copy.append(label, preview);

  const actions = document.createElement("div");
  actions.className = "result-actions";

  const open = document.createElement("a");
  open.className = "result-button secondary";
  open.href = link;
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.textContent = "Buka";

  const copyButton = document.createElement("button");
  copyButton.className = "result-button";
  copyButton.type = "button";
  copyButton.textContent = "Salin link";
  copyButton.addEventListener("click", () => copyText(link, copyButton));

  actions.append(open, copyButton);
  row.append(copy, actions);

  const links = document.createElement("div");
  links.className = "message-links";
  links.append(row);
  card.append(links);

  return card;
}

function renderInboxResults(data, email) {
  inboxResults.replaceChildren();
  const messages = normalizeMessages(data);
  const latest = newestMessage(messages);
  const link = latestAlightLink(latest);

  inboxResults.append(
    createResultsHead(
      "Link terbaru",
      email
    )
  );

  if (!messages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-result";
    empty.textContent = "Belum ada pesan. Tunggu sebentar lalu ambil link terbaru lagi.";
    inboxResults.append(empty);
    inboxResults.classList.remove("hidden");
    return { foundMessage: false, foundLink: false };
  }

  if (!link) {
    const empty = document.createElement("div");
    empty.className = "empty-result";
    empty.textContent = "Pesan terbaru ditemukan, tapi link Alight Motion belum terbaca.";
    inboxResults.append(empty);
    inboxResults.classList.remove("hidden");
    return { foundMessage: true, foundLink: false };
  }

  inboxResults.append(createLatestLinkCard(latest, link));
  inboxResults.classList.remove("hidden");
  return { foundMessage: true, foundLink: true };
}

bulkForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearToolNotice(bulkNotice);
  bulkResults.classList.add("hidden");

  const amount = Number(bulkAmount.value);
  const maximum = effectiveBulkMax(bulkStatus);
  if (!Number.isInteger(amount) || amount < 1 || amount > maximum) {
    setToolNotice(bulkNotice, "error", `Maksimal ${maximum} akun per request.`);
    return;
  }

  setToolBusy(bulkSubmit, bulkButtonText, true, "Membuat email Premium...", "Buat email Premium");

  try {
    const data = await postJson("/api/bulk", { amount });
    renderBulkResults(data, amount);
    setToolNotice(
      bulkNotice,
      "success",
      getMessage(data, "Email Premium berhasil dibuat dan siap dipakai.")
    );
    await fetchBulkStatus();
  } catch (error) {
    const code = error.code;
    const limit = Number(error.data?.bulk_max ?? error.data?.data?.bulk_max ?? bulkStatus?.bulk_max);
    if (code === "BULK_DAILY_LIMIT_EXCEEDED") {
      setToolNotice(bulkNotice, "error", "Kuota Bulk Web hari ini habis.");
      openBotOnlyModal();
      await fetchBulkStatus();
    } else if (code === "BULK_MAX_EXCEEDED") {
      setToolNotice(bulkNotice, "error", `Maksimal ${Number.isFinite(limit) ? limit : effectiveBulkMax(bulkStatus)} akun per request.`);
      await fetchBulkStatus();
    } else {
    setToolNotice(
      bulkNotice,
      "error",
      "Email Premium gagal dibuat. Silakan coba lagi."
    );
    }
  } finally {
    setToolBusy(bulkSubmit, bulkButtonText, false, "", "Buat email Premium");
    if (bulkStatus && effectiveBulkMax(bulkStatus) === 0) bulkSubmit.disabled = true;
  }
});

inboxForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearToolNotice(inboxNotice);
  inboxResults.classList.add("hidden");

  const email = inboxEmail.value.trim().toLowerCase();
  if (!isEmail(email)) {
    setToolNotice(inboxNotice, "error", "Masukkan email yang valid.");
    return;
  }

  setToolBusy(inboxSubmit, inboxButtonText, true, "Mengambil link...", "Ambil link terbaru");

  try {
    const data = await postJson("/api/inbox", { email });
    const result = renderInboxResults(data, email);
    setToolNotice(
      inboxNotice,
      result.foundLink ? "success" : result.foundMessage ? "error" : "success",
      result.foundLink
        ? "Link Alight Motion dari pesan terbaru berhasil ditemukan."
        : result.foundMessage
          ? "Pesan terbaru ada, tapi link Alight Motion belum ditemukan."
          : "Inbox berhasil dicek, belum ada pesan baru."
    );
  } catch (error) {
    setToolNotice(
      inboxNotice,
      "error",
      error.message || "Inbox gagal dibaca."
    );
  } finally {
    setToolBusy(inboxSubmit, inboxButtonText, false, "", "Ambil link terbaru");
  }
});
