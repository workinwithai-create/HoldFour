const CDN = "https://cdn.jsdelivr.net/gh/workinwithai-create/PreEight@main/public/samples";
const STEPS = 16;
const SECTION = 4;
const HOLD = 4;
const recipes = [
  { id:"pedal-hold", name:"Pedal hold", blurb:"Bass sits on the root. Hats thin. Next section has air." },
  { id:"pad-sit", name:"Pad sit", blurb:"Piano and nylon hold a pad shape. No new figure." },
  { id:"half-time", name:"Half time", blurb:"Kit drops to half. Snare on 3 only. Room opens." },
  { id:"kit-thin", name:"Kit thin", blurb:"Hats die. Kick on 1. Soft ride only." },
  { id:"bass-sit", name:"Bass sit", blurb:"Upright holds one note. No walk." },
  { id:"nylon-air", name:"Nylon air", blurb:"One nylon figure on bar 8, then silence." },
  { id:"brass-hold", name:"Brass hold", blurb:"Trumpet long tone on the fifth. Live, not a synth pad." },
  { id:"violin-line", name:"Violin line", blurb:"One soft violin line that does not resolve." },
  { id:"stop-hold", name:"Stop hold", blurb:"Two hits, then two bars of air before the next section." },
  { id:"full-hold", name:"Full hold", blurb:"Everyone sits. No new information. Just room." }
];
function bar(symbol, piano, guitar, bass){ return { symbol, piano, guitar, bass }; }
const grooves = [
  { id:"amber", name:"Amber Room", bpm:96, key:"A minor",
    section:[bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31)],
    hold:[bar("Am",[45,48,52,57],[45,52,57],33),bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("Am",[45,48,52,57],[45,52,57],33)] },
  { id:"porch", name:"Porch Light", bpm:88, key:"E major",
    section:[bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33)],
    hold:[bar("E",[40,44,47,52],[40,47,52],28),bar("E",[40,44,47,52],[40,47,52],28),bar("A",[33,37,40,45],[33,40,45],33),bar("E",[40,44,47,52],[40,47,52],28)] },
  { id:"fold", name:"Fold Night", bpm:102, key:"D minor",
    section:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24)],
    hold:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("Dm",[38,41,45,50],[38,45,50],26)] }
];
const state = { groove: grooves[0], recipe: recipes[0], playing:false, bar:0, mode:null };
let ctx, bus, buffers = {};
async function load() {
  ctx = new AudioContext();
  bus = ctx.createGain(); bus.gain.value = 0.35; bus.connect(ctx.destination);
  const files = [
    ["kick",`${CDN}/drums/kick.mp3`],["snare",`${CDN}/drums/snare.mp3`],["hat",`${CDN}/drums/hihat.mp3`],["crash",`${CDN}/drums/crash.mp3`],
    ["pC3",`${CDN}/piano/C3.mp3`],["pC4",`${CDN}/piano/C4.mp3`],["pA3",`${CDN}/piano/A3.mp3`],
    ["bE1",`${CDN}/bass/E1.mp3`],["bA1",`${CDN}/bass/A1.mp3`],["bC2",`${CDN}/bass/C2.mp3`],
    ["gE2",`${CDN}/guitar/E2.mp3`],["gA2",`${CDN}/guitar/A2.mp3`],["gE3",`${CDN}/guitar/E3.mp3`],
    ["tC4",`${CDN}/trumpet/C4.mp3`],["vA3",`${CDN}/violin/A3.mp3`]
  ];
  let n=0;
  for (const [k,url] of files) {
    try { const r = await fetch(url); buffers[k] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) { console.warn(k, e); }
    n++; document.getElementById("status").textContent = `Seating chairs ${n}/${files.length}`;
  }
  document.getElementById("status").textContent = "Chairs seated · live FluidR3 + kit";
}
function playBuf(name, when, rate=1, gain=0.4) {
  const b = buffers[name]; if (!b || !ctx) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(bus); src.start(when);
}
function rateFromMidi(midi, baseMidi){ return Math.pow(2, (midi-baseMidi)/12); }
function chordAt(i){ return i < SECTION ? state.groove.section[i] : state.groove.hold[i-SECTION]; }
function scheduleBar(barIndex, t0, stepDur){
  const ch = chordAt(barIndex); const onHold = barIndex >= SECTION; const rec = state.recipe.id;
  for (let s=0;s<STEPS;s++){
    const when = t0 + s*stepDur;
    // Kit
    if (onHold && (rec==="kit-thin" || rec==="stop-hold" || rec==="full-hold")) {
      if (s===0) playBuf("kick", when, 1, 0.35);
      if (s%4===0 && rec!=="stop-hold") playBuf("hat", when, 1, 0.03);
    } else if (onHold && rec==="half-time") {
      if (s===0) playBuf("kick", when, 1, 0.55);
      if (s===8) playBuf("snare", when, 1, 0.35);
      if (s%4===0) playBuf("hat", when, 1, 0.04);
    } else {
      if (s%2===0) playBuf("hat", when, 1, onHold ? 0.05 : 0.07);
      if (s===0) playBuf("kick", when, 1, 0.7);
      if (s===8) playBuf("snare", when, 1, 0.45);
    }
    // Chairs on downbeats
    if (s===0) {
      const pianoGain = onHold && (rec==="pad-sit" || rec==="full-hold") ? 0.32 : 0.26;
      playBuf("pC4", when, rateFromMidi(ch.piano[2]||60, 60), pianoGain);
      playBuf("pA3", when, rateFromMidi(ch.piano[1]||57, 57), 0.2);
      const bassGain = onHold && (rec==="bass-sit" || rec==="pedal-hold") ? 0.55 : 0.42;
      playBuf("bA1", when, rateFromMidi(ch.bass, 33), bassGain);
      if (!(onHold && rec==="kit-thin")) playBuf("gA2", when, rateFromMidi(ch.guitar[0]||45, 45), onHold ? 0.18 : 0.22);
    }
    // Special holds
    if (onHold && rec==="brass-hold" && s===0) playBuf("tC4", when, rateFromMidi((ch.piano[2]||60)+7, 60), 0.28);
    if (onHold && rec==="violin-line" && (s===0 || s===8)) playBuf("vA3", when, rateFromMidi(ch.piano[2]||60, 57), 0.2);
    if (onHold && rec==="nylon-air" && barIndex===7 && s===0) playBuf("gE3", when, rateFromMidi(ch.guitar[0]||45, 52), 0.3);
    if (onHold && rec==="stop-hold" && barIndex>=6) continue;
  }
}
let timer=null;
function stop(){ state.playing=false; state.mode=null; if(timer) clearTimeout(timer); timer=null; paintBars(); }
async function play(mode){
  if (!ctx) await load();
  if (ctx.state==="suspended") await ctx.resume();
  stop(); state.playing=true; state.mode=mode;
  const startBar = mode==="eight" ? SECTION : 0;
  const endBar = mode==="loop" ? SECTION : SECTION+HOLD;
  const stepDur = 60/state.groove.bpm/4;
  let barIndex = startBar;
  const tick = () => {
    if (!state.playing) return;
    if (barIndex >= endBar) { if (mode==="loop") barIndex = startBar; else { stop(); return; } }
    state.bar = barIndex; paintBars();
    scheduleBar(barIndex, ctx.currentTime+0.02, stepDur);
    barIndex += 1;
    timer = setTimeout(tick, STEPS*stepDur*1000);
  };
  tick();
}
function punch(){
  const g=state.groove, r=state.recipe;
  return `HoldFour punch list\n${g.name} · ${g.bpm} BPM · ${g.key} · ${r.name}\n\nThe problem: the section loops or collapses. Session players write four live bars of hold so the next section has air.\nThe move: ${r.blurb}\n\nSection (bars 1-4)\n${g.section.map((b,i)=>`  ${i+1}. ${b.symbol}`).join("\n")}\n\nHold (bars 5-8) — ${r.name}\n${g.hold.map((b,i)=>`  ${i+5}. ${b.symbol}`).join("\n")}\n\nLive chairs only (FluidR3 piano, upright, nylon, trumpet, violin + kit). Distinct from WalkFour, LiftTwo, TagFour, PreEight, AfterHook, EndEight, LastHook, AirFour, DropFour.\nDrop the WAV on bars 5-8. Do not loop the section into itself.`;
}
function paintGrooves(){
  const el=document.getElementById("grooves"); el.innerHTML="";
  grooves.forEach(g=>{ const b=document.createElement("button"); b.className="card"+(state.groove.id===g.id?" on":""); b.innerHTML=`<b>${g.name}</b><span>${g.bpm} BPM · ${g.key}</span>`; b.onclick=()=>{ state.groove=g; render(); }; el.appendChild(b); });
}
function paintRecipes(){
  const el=document.getElementById("recipes"); el.innerHTML="";
  recipes.forEach(r=>{ const b=document.createElement("button"); b.className="card"+(state.recipe.id===r.id?" on":""); b.innerHTML=`<b>${r.name}</b><span>${r.blurb}</span>`; b.onclick=()=>{ state.recipe=r; render(); }; el.appendChild(b); });
}
function paintBars(){
  const el=document.getElementById("bars"); el.innerHTML="";
  for(let i=0;i<8;i++){ const ch=chordAt(i); const d=document.createElement("div"); d.className="bar"+(i>=4?" hold":"")+(state.playing && state.bar===i?" active":""); d.innerHTML=`<div class="n">${i+1} · ${i>=4?"H":"S"}</div><div class="c">${ch.symbol}</div>`; el.appendChild(d); }
}
function render(){ paintGrooves(); paintRecipes(); paintBars(); document.getElementById("punch").textContent = punch(); }
document.getElementById("playA").onclick=()=>play("loop");
document.getElementById("playB").onclick=()=>play("cut");
document.getElementById("play8").onclick=()=>play("eight");
document.getElementById("stop").onclick=stop;
document.getElementById("copy").onclick=()=>navigator.clipboard.writeText(punch());
render();
load();
