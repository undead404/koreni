export default function scrollOnce(element: HTMLElement | null) {
  if (!element) {
    return;
  }
  if (element.dataset.hasScrolled) {
    return;
  }
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
  element.dataset.hasScrolled = 'true';
}
