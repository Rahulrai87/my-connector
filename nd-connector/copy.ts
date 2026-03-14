handleClick(event: any) {

  if (event.target.classList.contains('copy-li')) {

    const text = event.target.parentElement.innerText
      .replace('Copy','')
      .trim();

    navigator.clipboard.writeText(text);

    event.target.innerText = 'Copied';
  }
}

handleClick(event: any) {

  if (event.target.classList.contains('copy-li')) {

    const text = event.target.parentElement.innerText
      .replace('Copy','')
      .trim();

    navigator.clipboard.writeText(text);

    event.target.innerText = 'Copied';
  }
}
<div
  class="chat-markdown"
  [innerHTML]="renderedMarkdown"
  (click)="handleClick($event)">
</div>

.chat-markdown li {
  position: relative;
}

.copy-li {
  position: absolute;
  right: -60px;
  font-size: 11px;
  cursor: pointer;
  display: none;
}

.chat-markdown li:hover .copy-li {
  display: inline;
}
