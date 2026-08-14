import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

const ORIGIN = "https://www.usmortgagecalc.com";

@Component({
  selector: "usmc-mortgage-calculator",
  standalone: true,
  template: `
    <iframe
      #frame
      [src]="src"
      title="US Mortgage Calculator"
      loading="lazy"
      [style.height.px]="height"
      style="width:100%;border:0;display:block"
    ></iframe>
  `,
})
export class MortgageCalculatorComponent implements OnInit, OnDestroy {
  @Input() state = "";
  @Input() price = "";
  @ViewChild("frame") frame?: ElementRef<HTMLIFrameElement>;

  src!: SafeResourceUrl;
  height = 720;

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const params = new URLSearchParams({ utm_source: "embed" });
    if (this.state) params.set("state", this.state);
    if (this.price) params.set("price", this.price);

    // bypassSecurityTrustResourceUrl is safe here because the URL is built from
    // a constant origin and encoded parameters, never from user input.
    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
      `${ORIGIN}/embed/calculator?${params}`,
    );

    window.addEventListener("message", this.onMessage);
  }

  ngOnDestroy(): void {
    window.removeEventListener("message", this.onMessage);
  }

  // Arrow function so `this` survives being used as a listener.
  private readonly onMessage = (event: MessageEvent): void => {
    if (event.origin !== ORIGIN) return;
    if (event.data?.type !== "usmc:height") return;
    if (event.source !== this.frame?.nativeElement.contentWindow) return;

    const next = Number(event.data.height);
    if (Number.isFinite(next) && next > 0) this.height = Math.ceil(next);
  };
}
