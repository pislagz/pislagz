let delayPlayFooterAction = false;

export function schedulePlayFooterActionDelay() {
  delayPlayFooterAction = true;
}

export function shouldDelayPlayFooterAction() {
  return delayPlayFooterAction;
}

export function clearPlayFooterActionDelay() {
  delayPlayFooterAction = false;
}
