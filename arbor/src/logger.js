/**
 * CODAP Arbor Research Logger v2
 */
(function () {
  "use strict";
  var SUPABASE_URL = "https://jycizbiclzyjapmxntya.supabase.co";
  var SUPABASE_KEY = "sb_secret_aknZfuuWplP30OtG5vYF_w_X5Ece8E3";
  var LOG_TABLE = "logs";
  var studentId = null;
  var sessionStart = null;
  var queue = [];

  function sendLog(action, parameters, rawData) {
    if (!studentId) { queue.push({action:action,parameters:parameters,rawData:rawData}); return; }
    var payload = {student_id:studentId, action:action, timestamp_ms:Date.now()-sessionStart, parameters:parameters||{}, raw_data:rawData||{}};
    fetch(SUPABASE_URL+"/rest/v1/"+LOG_TABLE, {
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Prefer":"return=minimal"},
      body:JSON.stringify(payload)
    }).then(function(r){if(r.ok){console.log("[Logger] OK:",action);}else{r.text().then(function(t){console.warn("[Logger] Err:",t);});}})
    .catch(function(e){console.warn("[Logger] Net:",e);});
  }

  function flushQueue() {
    var p=queue.slice(); queue=[];
    p.forEach(function(i){sendLog(i.action,i.parameters,i.rawData);});
  }

  function setupCODAPListeners() {
    if (typeof codapInterface==="undefined"){console.warn("[Logger] codapInterface yok");return;}
    codapInterface.on("notify","component",function(n){
      sendLog("codap_component",{operation:n.values&&n.values.operation,type:n.values&&n.values.type},n);
    });
    codapInterface.on("notify","documentChangeNotice",function(n){
      sendLog("codap_document_change",{operation:n.values&&n.values.operation},n);
    });
    codapInterface.on("notify","dragDrop[attribute]",function(n){
      var v=n.values||{};
      sendLog("codap_drag_drop",{operation:v.operation,attribute:v.attribute&&v.attribute.name,context:v.context&&v.context.name},n);
    });
    codapInterface.on("notify","dataContextChangeNotice",function(n){
      sendLog("codap_data_change",{operation:n.values&&n.values.operation,resource:n.resource},n);
    });
    console.log("[Logger] CODAP dinleyicileri hazir");
  }

  function showOverlay(onReady) {
    var style=document.createElement("style");
    style.textContent="#_logOverlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:2147483647;font-family:-apple-system,sans-serif;}"
      +"#_logBox{background:#fff;border-radius:12px;padding:32px 36px 28px;width:300px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.35);}"
      +"#_logBox h2{margin:0 0 6px;font-size:19px;color:#1a1a2e;}"
      +"#_logBox p{margin:0 0 16px;font-size:13px;color:#666;}"
      +"#_logInput{width:100%;box-sizing:border-box;padding:10px 12px;font-size:15px;border:2px solid #ccd;border-radius:8px;outline:none;margin-bottom:12px;}"
      +"#_logInput:focus{border-color:#4a6fa5;}"
      +"#_logBtn{width:100%;padding:10px;font-size:15px;font-weight:600;color:#fff;background:#4a6fa5;border:none;border-radius:8px;cursor:pointer;}"
      +"#_logErr{color:#c0392b;font-size:12px;margin-top:8px;min-height:16px;}";
    document.head.appendChild(style);
    var overlay=document.createElement("div");
    overlay.id="_logOverlay";
    overlay.innerHTML='<div id="_logBox"><h2>Arbor Arastirmasi</h2><p>Luetfen adinizi veya ogrenci numaranizi girin.</p><input id="_logInput" type="text" placeholder="Adiniz / Ogrenci No" autocomplete="off" maxlength="80"/><button id="_logBtn">Devam Et</button><div id="_logErr"></div></div>';
    document.body.appendChild(overlay);
    var input=document.getElementById("_logInput");
    var btn=document.getElementById("_logBtn");
    var err=document.getElementById("_logErr");
    setTimeout(function(){input.focus();},100);
    function submit(){
      var val=input.value.trim();
      if(!val){err.textContent="Lutfen adinizi girin.";return;}
      studentId=val; sessionStart=Date.now();
      overlay.remove(); style.remove();
      sendLog("session_start",{student_id:studentId},{});
      flushQueue();
      if(typeof onReady==="function") onReady(studentId);
    }
    btn.addEventListener("click",submit);
    input.addEventListener("keydown",function(e){if(e.key==="Enter")submit();});
  }

  function init() {
    showOverlay(function(id){
      console.log("[Logger] Oturum basladi:",id);
      setupCODAPListeners();
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init);
  } else {
    init();
  }

  window.arborLogger = {
    log: function(a,p,r){sendLog(a,p,r);},
    getStudentId: function(){return studentId;},
    setupCODAPListeners: setupCODAPListeners,
    initialize: function(cb){
      if(studentId){setupCODAPListeners();if(typeof cb==="function")cb(studentId);}
    }
  };
})();
