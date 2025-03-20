export function tweenTo(object, property, target, time, easing, onchange, oncomplete, tweening) {
    const tween = {
      object,
      property,
      propertyBeginValue: object[property],
      target,
      easing,
      time,
      change: onchange,
      complete: oncomplete,
      start: Date.now(),
    };
    tweening.push(tween); // Add to the provided tweening array
  }
  
  export function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
  }
  
  export function linear() {
    return (t) => t;
  }