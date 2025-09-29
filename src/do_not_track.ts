/**
 * Gets the browser's "Do Not Track" setting.
 *
 * @returns {string} The DNT setting ('1' for enabled, '0' for disabled, 'unspecified' for not set).
 */
export default function getDoNotTrack(): string {
  // The navigator.doNotTrack API is a standard and returns a string value.
  // '1' means the user has DNT enabled.
  // '0' means the user has DNT disabled.
  // 'unspecified' means the user has not expressed a preference.
  // We also check for legacy 'yes' and 'no' values for older browser compatibility.
  const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;

  if (dnt === '1' || dnt === 'yes') {
    return '1';
  }
  if (dnt === '0' || dnt === 'no') {
    return '0';
  }
  return 'unspecified';
}