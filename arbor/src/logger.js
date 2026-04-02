/**
 * CODAP Arbor Research Logger
 * HTML overlay ile öğrenci adı alır, Supabase'e loglar.
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://jycizbiclzyjapmxntya.supabase.co";
  const SUPABASE_KEY = "sb_secret_aknZfuuWplP30OtG5vYF_w_X5Ece8E3";
  const LOG_TABLE = "logs";

  let studentId = null;
  let sessionStart = Date.now();
  let pendingQueue = [];

  function sendLog(action, parameters, rawData) {
    if (!studentId) {
      pendingQueue.push({ action, parameters, rawData });
      return;
    }
    const payload = {
      student_id: studentId,
      action: action,
      timestamp_ms: Date.now() - sessionStart,
      parameters: parameters || {},
      raw_data: rawData || {},
    };
    fetch(SUPABASE_URL + "/rest/v1/" + LOG_TABLE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) {
          res.text().then(function (t) { console.warn("[Logger] Supabase hata:", t); });
        } else {
          console.log("[Logger] OK →", action);
        }
      })
      .catch(function (err) { console.warn("[Logger] Ağ hatası:", err); });
  }

  function flushQueue() {
    var pending = pendingQueue.slice();
    pendingQueue = [];
    pending.forEach(function (item) {
      sendLog(item.action, item.parameters, item.rawData);
    });
  }

  function showStudentForm(onReady) {
    if (document.getElementById("arborLoggerOverlay")) return;

    var style = document.createElement("style");
    style.textContent = [
      "#arborLoggerOverlay{position:fixed;inset:0;background:rgba(0,0,0,.65);",
      "display:flex;align-items:center;justify-content:center;z-index:99999;",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
      "#arborLoggerBox{background:#fff;border-radius:12px;padding:36px 40px 28px;",
      "width:320px;box-shadow:0 8px 32px rgba(0,0,0,.28);text-align:center;}",
      "#arborLoggerBox h2{margin:0 0 8px;font-size:20px;color:#1a1a2e;}",
      "#arborLoggerBox p{margin:0 0 18px;font-size:14px;color:#555;}",
      "#arborStudentInput{width:100%;box-sizing:border-box;padding:10px 14px;",
      "font-size:15px;border:2px solid #d0d0e0;border-radius:8px;outline:none;",
      "margin-bottom:14px;transition:border-color .2s;}",
      "#arborStudentInput:focus{border-color:#4a6fa5;}",
      "#arborStudentBtn{width:100%;padding:11px;font-size:15px;font-weight:600;",
      "color:#fff;background:#4a6fa5;border:none;border-radius:8px;cursor:pointer;}",
      "#arborStudentBtn:hover{background:#3a5a8f;}",
      "#arborStudentError{color:#c0392b;font-size:13px;margin-top:8px;min-height:18px;}"
    ].join("");
    document.head.appendChild(style);

    var overlay = document.createElement("div");
    overlay.id = "arborLoggerOverlay";
    overlay.innerHTML =
      '<div id="arborLoggerBox">' +
        '<h2>&#127795; Arbor Araştırması</h2>' +
        '<p>Lütfen adınızı veya öğrenci numaranızı girin.</p>' +
        '<input id="arborStudentInput" type="text" placeholder="Adınız / Öğrenci No"' +
        ' autocomplete="off" maxlength="80"/>' +
        '<button id="arborStudentBtn">Devam Et</button>' +
        '<div id="arborStudentError"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById("arborStudentInput");
    var btn   = document.getElementById("arborStudentBtn");
    var errEl = document.getElementById("arborStudentError");
    input.focus();

    function submit() {
      var val = input.value.trim();
      if (!val) { errEl.textContent = "Lütfen adınızı girin."; input.focus(); return; }
      errEl.textContent = "";
      studentId = val;
      overlay.remove();
      style.remove();
      sessionStart = Date.now();
      sendLog("session_start", { student_id: studentId }, {});
      flushQueue();
      if (typeof onReady === "function") onReady(studentId);
    }

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  }

  function setupCODAPListeners() {
    if (typeof codapInterface === "undefined") return;

    codapInterface.on("notify", "component", function (notice) {
      sendLog("codap_component", {
        operation: notice.values && notice.values.operation,
        type: notice.values && notice.values.type,
      }, notice);
    });

    codapInterface.on("notify", "dataContextChangeNotice", function (notice) {
      sendLog("codap_data_change", {
        operation: notice.values && notice.values.operation,
        resource: notice.resource,
      }, notice);
    });

    codapInterface.on("notify", "dragDrop[attribute]", function (notice) {
      sendLog("codap_attribute_drag", {
        attribute: notice.values && notice.values.attribute && notice.values.attribute.name,
      }, notice);
    });

    console.log("[Logger] CODAP dinleyicileri kuruldu");
  }

  function setupDOMListeners() {
    document.addEventListener("click", function (e) {
      var el  = e.target;
      var tag = el.tagName || "";
      var cls = (el.className && typeof el.className === "string") ? el.className : "";
      if (
        tag === "BUTTON" ||
        el.getAttribute("role") === "button" ||
        cls.indexOf("node") !== -1 ||
        cls.indexOf("split") !== -1 ||
        cls.indexOf("delete") !== -1 ||
        cls.indexOf("drop") !== -1 ||
        cls.indexOf("trash") !== -1
      ) {
        sendLog("dom_click", {
          tag: tag,
          class: cls,
          text: (el.textContent || "").trim().slice(0, 60),
          id: el.id || "",
        }, {});
      }
    }, true);
  }

  window.arborLogger = {
    initialize: function (onReady) {
      showStudentForm(function (id) {
        setupDOMListeners();
        if (typeof onReady === "function") onReady(id);
      });
    },
    setupCODAPListeners: setupCODAPListeners,
    log: function (action, parameters, rawData) { sendLog(action, parameters, rawData); },
    getStudentId: function () { return studentId; },
  };
})();
