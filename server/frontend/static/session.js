async function checkSession(){
  try { const data=await (await fetch('/djangoapp/session')).json();
    if(!data.userName)return;
    const account=document.getElementById('account');account.replaceChildren();
    const label=document.createElement('span');label.textContent=data.userName;
    const button=document.createElement('button');button.textContent='Logout';button.className='button secondary';
    button.addEventListener('click',async()=>{button.disabled=true;try{
      const token=document.cookie.split('; ').find(x=>x.startsWith('csrftoken='))?.split('=')[1]||'';
      const response=await fetch('/djangoapp/logout',{method:'POST',headers:{'X-CSRFToken':token}});
      if(!response.ok)throw new Error();window.location.href='/';
    }catch{button.disabled=false;button.textContent='Retry logout';}});
    account.append(label,button);
  } catch { /* Public pages remain available if authentication is unavailable. */ }
}checkSession();
