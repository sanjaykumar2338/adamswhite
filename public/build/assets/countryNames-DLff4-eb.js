function u(n,r,t){if(!n||n==="unknown")return t;try{return new Intl.DisplayNames([r],{type:"region"}).of(n)||n}catch{return n}}export{u as c};
