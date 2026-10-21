/* A new local Excel example is independent of the immutable recorded replay. */
(function(){
 "use strict";
 let generated=null;
 function mount(doc){
  const picker=doc?.querySelector('.deck select[aria-label="Recorded scenario"]');
  if(!picker||doc.getElementById('architecture-case-generator'))return;
  const root=doc.createElement('div');
  root.id='architecture-case-generator';
  root.innerHTML='<div class="acg-actions"><button type="button" data-case-generate>Generate random case</button>'
   +'<button type="button" data-case-download disabled>Download Excel ↓</button></div>'
   +'<output class="acg-status" aria-live="polite" hidden></output>';
  const output=root.querySelector('output'),download=root.querySelector('[data-case-download]');
  const show=()=>{
   if(!generated)return;
   root.dataset.invoiceId=generated.invoice.invoice_id;
   root.dataset.caseKind=generated.kind;
   download.disabled=false;output.hidden=false;
   output.textContent='Generated Excel case · '+generated.invoice.invoice_id+' · '+generated.label
    +'. Upload under Document collection for local checks. Recorded replay is unchanged.';
  };
  root.querySelector('[data-case-generate]').addEventListener('click',()=>{
   try{generated=window.PublicSupplierWorkbook.random();show();}
   catch(error){output.hidden=false;output.textContent='Could not generate the example: '+error.message;}
  });
  download.addEventListener('click',()=>{
   if(generated)window.PublicSupplierWorkbook.downloadInvoice(generated.invoice,generated.kind);
  });
  picker.insertAdjacentElement('afterend',root);
  show();
 }
 window.ArchitectureCaseGenerator={mount};
})();
