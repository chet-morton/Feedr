/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 174: cannot create temp file for here document: Operation not permitted
/opt/homebrew/Cellar/rbenv/1.3.2/libexec/rbenv-init: line 199: cannot create temp file for here document: Operation not permitted
function rationApp() {
  return {
    species:'horse', stage:'Maintenance', groupName:'', head:1, weight:1000,
    targets:{daily_dm:20,daily_protein:2,daily_energy:20,daily_calcium:0.04,daily_phosphorus:0.03},
    targetFields:[{key:'daily_dm',label:'Dry matter',unit:'lb'},{key:'daily_protein',label:'Crude protein',unit:'lb'},{key:'daily_energy',label:'Energy',unit:'Mcal'},{key:'daily_calcium',label:'Calcium',unit:'lb'},{key:'daily_phosphorus',label:'Phosphorus',unit:'lb'}],
    feeds:[{id:1,name:'Grass hay',amount:20,dm_pct:90,protein_pct:10,energy_mcal_kg:2.0,calcium_pct:0.4,phosphorus_pct:0.25,cost_per_lb:0,is_forage:true}],
    result:null, busy:false,error:'',toast:'',help:'',showAccount:false,showHerd:false,showAbout:false,
    pbUrl:'', user:null, email:'', password:'', authToken:'', savedRations:[],
    init(){this.pbUrl=(window.fieldfareConfig||{}).pocketbaseUrl||'';this.restoreDraft();this.restoreAuth();if(this.user)this.loadRations();this.$watch('feeds',()=>this.saveDraft(),{deep:true});this.$watch('targets',()=>this.saveDraft(),{deep:true});},
    applyPreset(){
      if(this.species==='horse'){this.weight=1000;this.targets={daily_dm:20,daily_protein:2,daily_energy:20,daily_calcium:0.04,daily_phosphorus:0.03};}
      if(this.species==='sheep'){this.weight=150;this.targets={daily_dm:2.6,daily_protein:0.25,daily_energy:0,daily_calcium:0.0055,daily_phosphorus:0.0053};this.stage='Maintenance';}
      if(this.species==='deer'){this.weight=150;this.targets={daily_dm:0,daily_protein:0,daily_energy:0,daily_calcium:0,daily_phosphorus:0};this.stage='Custom';}
      this.result=null;this.saveDraft();
    },
    addFeed(){if(this.feeds.length>=24)return;this.feeds.push({id:Date.now()+Math.random(),name:'',amount:0,dm_pct:90,protein_pct:0,energy_mcal_kg:0,calcium_pct:0,phosphorus_pct:0,cost_per_lb:0,is_forage:false});},
    removeFeed(i){if(this.feeds.length>1)this.feeds.splice(i,1);},
    async calculate(){
      this.error='';this.busy=true;
      try{const body={species:this.species,head_count:this.head,body_weight:this.weight,targets:this.targets,feeds:this.feeds,units:'lb'};const r=await fetch('/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Could not analyze this ration.');this.result=data;this.showHerd=true;this.saveDraft();document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'});}
      catch(e){this.error=e.message||'The calculator could not reach the server. Check your connection and try again.';}finally{this.busy=false;}
    },
    barClass(m){if(!m.target)return 'bar-neutral';if(m.coverage_pct<90)return 'bar-low';if(m.coverage_pct<=110)return 'bar-good';return 'bar-high';},
    formatMetric(n,u){return (Number(n)||0).toFixed(u==='Mcal'?1:2)+' '+u;},
    loadExample(){this.feeds=[{id:Date.now(),name:'Grass hay',amount:18,dm_pct:90,protein_pct:10,energy_mcal_kg:2.0,calcium_pct:.4,phosphorus_pct:.25,cost_per_lb:.18,is_forage:true},{id:Date.now()+1,name:'Complete feed',amount:2,dm_pct:90,protein_pct:14,energy_mcal_kg:2.8,calcium_pct:.8,phosphorus_pct:.45,cost_per_lb:.42,is_forage:false}];this.result=null;this.toastMsg('Example loaded. Replace values with your feed analysis and prices.');},
    resetRation(){this.feeds=[{id:Date.now(),name:'',amount:0,dm_pct:90,protein_pct:0,energy_mcal_kg:0,calcium_pct:0,phosphorus_pct:0,cost_per_lb:0,is_forage:false}];this.result=null;this.error='';this.saveDraft();},
    saveDraft(){try{localStorage.setItem('fieldfare-draft',JSON.stringify({species:this.species,stage:this.stage,groupName:this.groupName,head:this.head,weight:this.weight,targets:this.targets,feeds:this.feeds}));}catch(e){}},
    restoreDraft(){try{const d=JSON.parse(localStorage.getItem('fieldfare-draft')||'null');if(d){Object.assign(this,d);}}catch(e){}},
    toastMsg(s){this.toast=s;setTimeout(()=>this.toast='',2800);},
    openAccount(){this.showAccount=true;if(this.user)this.loadRations();},
    restoreAuth(){try{const a=JSON.parse(localStorage.getItem('fieldfare-auth')||'null');if(a){this.user=a.record;this.authToken=a.token;}}catch(e){}},
    async authRequest(path,data){const r=await fetch(this.pbUrl+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw new Error(j.message||'PocketBase request failed');return j;},
    async signIn(){try{const a=await this.authRequest('/api/collections/users/auth-with-password',{identity:this.email,password:this.password});this.setAuth(a);}catch(e){this.toastMsg(e.message);}},
    async register(){try{await this.authRequest('/api/collections/users/records',{email:this.email,password:this.password,passwordConfirm:this.password});await this.signIn();}catch(e){this.toastMsg(e.message);}},
    setAuth(a){this.authToken=a.token;this.user=a.record;localStorage.setItem('fieldfare-auth',JSON.stringify(a));this.loadRations();this.toastMsg('Account connected.');},
    signOut(){this.authToken='';this.user=null;this.savedRations=[];localStorage.removeItem('fieldfare-auth');},
    async loadRations(){if(!this.user)return;try{const filter=encodeURIComponent(`owner = "${this.user.id}"`);const r=await fetch(this.pbUrl+`/api/collections/rations/records?sort=-created&perPage=50&filter=${filter}`,{headers:{'Authorization':this.authToken}});const j=await r.json();if(!r.ok)throw new Error(j.message||'Could not load saved rations');this.savedRations=j.items||[];}catch(e){this.toastMsg(e.message);}},
    loadRation(item){this.species=item.species||'horse';this.stage=item.stage||'Maintenance';this.groupName=item.name||'';this.head=item.head_count||1;this.weight=item.body_weight||0;this.targets=item.targets||this.targets;this.feeds=(item.feeds||[]).map((f,i)=>({...f,id:Date.now()+i}));this.result=null;this.showAccount=false;this.saveDraft();this.calculate();},
    async saveRation(){if(!this.user||!this.result)return;try{const record={owner:this.user.id,name:this.groupName||`${this.species} daily ration`,species:this.species,stage:this.stage,head_count:this.head,body_weight:this.weight,targets:this.targets,feeds:this.feeds,analysis:this.result};const r=await fetch(this.pbUrl+'/api/collections/rations/records',{method:'POST',headers:{'Content-Type':'application/json','Authorization':this.authToken},body:JSON.stringify(record)});const j=await r.json();if(!r.ok)throw new Error(j.message||'Could not save ration');await this.loadRations();this.toastMsg('Ration saved to your account.');}catch(e){this.toastMsg(e.message);}}
  };
}
