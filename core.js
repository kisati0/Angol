/* Szómondó 1 — shared CSV, network and book storage helpers, v72. */
(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.SzomondoCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  function detectDelimiter(text){
    const counts = { ';':0, ',':0, '\t':0 };
    let quoted = false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){
        if(quoted && text[i+1]==='"'){ i++; continue; }
        quoted=!quoted;
      }else if(!quoted){
        if(c==='\n' || c==='\r') break;
        if(Object.prototype.hasOwnProperty.call(counts,c)) counts[c]++;
      }
    }
    return Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
  }

  function parseCsv(input, delimiter){
    const text=String(input || '').replace(/^\uFEFF/,'');
    delimiter=delimiter || detectDelimiter(text);
    const rows=[];
    let row=[],field='',quoted=false,closedQuote=false,line=1;
    const endField=()=>{ row.push(field);field='';closedQuote=false; };
    const endRow=()=>{ endField();if(row.some(cell=>cell.trim()!=='')) rows.push(row);row=[]; };
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){
        if(c==='"'){
          if(text[i+1]==='"'){ field+='"';i++; }
          else{ quoted=false;closedQuote=true; }
        }else{ field+=c;if(c==='\n') line++; }
        continue;
      }
      if(c===delimiter){ endField();continue; }
      if(c==='\r' || c==='\n'){
        if(c==='\r' && text[i+1]==='\n') i++;
        endRow();line++;continue;
      }
      if(closedQuote){
        if(c===' ' || c==='\t') continue;
        throw new Error('CSV-hiba a(z) '+line+'. sorban: karakter az idézőjel után.');
      }
      if(c==='"'){
        if(field.trim()!=='') throw new Error('CSV-hiba a(z) '+line+'. sorban: hibás idézőjel.');
        field='';quoted=true;
      }else field+=c;
    }
    if(quoted) throw new Error('CSV-hiba: lezáratlan idézőjel a(z) '+line+'. sor körül.');
    endRow();
    return rows;
  }

  function csvEscape(value, delimiter){
    const s=String(value == null ? '' : value);
    return s.includes(delimiter) || /["\r\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }

  async function fetchJson(url, options={}){
    const controller=new AbortController();
    const parent=options.signal;
    const abort=()=>controller.abort(parent.reason);
    if(parent){
      if(parent.aborted) abort();
      else parent.addEventListener('abort',abort,{once:true});
    }
    const timer=setTimeout(()=>controller.abort(new DOMException('A kérés túllépte az időkorlátot.','TimeoutError')),options.timeoutMs || 10000);
    try{
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok) throw new Error('HTTP '+response.status);
      return await response.json();
    }finally{
      clearTimeout(timer);
      if(parent) parent.removeEventListener('abort',abort);
    }
  }

  // v1: books/current, v2: library (complete records), v3: separate metadata.
  function createBookStore(idb, name='hu-ebook-store'){
    let connectionPromise=null;
    function open(){
      if(connectionPromise) return connectionPromise;
      connectionPromise=new Promise((resolve,reject)=>{
        const request=idb.open(name,3);
        let abandoned=false;
        request.onblocked=()=>{
          abandoned=true;connectionPromise=null;
          reject(new Error('A könyvtár frissítéséhez zárd be a Szómondó többi megnyitott ablakát, majd próbáld újra.'));
        };
        request.onupgradeneeded=event=>{
          const db=request.result,tx=request.transaction;
          const hadLibrary=db.objectStoreNames.contains('library');
          if(!hadLibrary) db.createObjectStore('library',{keyPath:'id'});
          if(!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata',{keyPath:'id'});
          const library=tx.objectStore('library'),metadata=tx.objectStore('metadata');
          if(hadLibrary){
            const cursor=library.openCursor();
            cursor.onsuccess=()=>{
              const item=cursor.result;
              if(!item) return;
              metadata.put({id:item.value.id,meta:item.value.meta || {}});
              item.continue();
            };
          }
          if(event.oldVersion<2 && db.objectStoreNames.contains('books')){
            const old=tx.objectStore('books').get('current');
            old.onsuccess=()=>{
              if(!old.result || !old.result.data) return;
              const record={id:'legacy-current',data:old.result.data,meta:old.result.meta || {name:'Korábbi könyv'}};
              library.put(record);metadata.put({id:record.id,meta:record.meta});
            };
          }
        };
        request.onerror=()=>{connectionPromise=null;reject(request.error);};
        request.onsuccess=()=>{
          const db=request.result;
          if(abandoned){db.close();return;}
          db.onversionchange=()=>{db.close();connectionPromise=null;};
          db.onclose=()=>{connectionPromise=null;};
          resolve(db);
        };
      });
      return connectionPromise;
    }
    async function read(storeName, id){
      const db=await open();
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(storeName,'readonly'),store=tx.objectStore(storeName);
        const request=id===undefined ? store.getAll() : store.get(id);
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error);
        tx.onabort=()=>reject(tx.error || new Error('Az olvasás megszakadt.'));
      });
    }
    async function write(record, remove){
      const db=await open();
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(['library','metadata'],'readwrite');
        if(remove){ tx.objectStore('library').delete(record);tx.objectStore('metadata').delete(record); }
        else{ tx.objectStore('library').put(record);tx.objectStore('metadata').put({id:record.id,meta:record.meta || {}}); }
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error || new Error('A könyv mentése megszakadt.'));
      });
    }
    return {open,list:()=>read('metadata'),get:id=>read('library',id),put:record=>write(record,false),delete:id=>write(id,true)};
  }

  return {parseCsv,detectDelimiter,csvEscape,fetchJson,createBookStore};
});
