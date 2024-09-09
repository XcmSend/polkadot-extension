// Copyright 2019-2024 @polkadot/extension authors & contributors, modified by bagpipes



const api_endpoint = "";

/*
// json blob parse
interface ActionParameter {
    name: string;
    label: string;
  }
  
  interface Action {
    label: string;
    href: string;
    parameters?: ActionParameter[];
  }
  
  interface Links {
    actions: Action[];
  }
  
  interface LinkInfo {
    icon: string;
    title: string;
    description: string;
    label: string;
    links: Links;
  }

*/

export function download_metadata(link_token: string) {
    const out = fetch(`${api_endpoint}/${link_token}`); //: LinkInfo

    return out;
}


export function html_base(logo: string, title: string, button_text: string){ //inputen: string
    const image = `<img title="${title}" src="${logo}">`;
    const full_body = `<span>
${image}<br>
<h4>${title}</h4>
    
<button class="flex w-full items-center justify-center text-nowrap rounded-button px-4 py-3 text-text font-semibold transition-colors motion-reduce:transition-none bg-button text-text-button hover:bg-button-hover"><input placeholder="${title}" required="" class="flex-1 truncate bg-input-bg text-text-input outline-none placeholder:text-text-input-placeholder disabled:text-text-input-disabled" type="number" value="">
    <span class="min-w-0 truncate">${button_text}</span></button>
</span>`;


    return full_body;
}