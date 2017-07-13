(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-array')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-array'], factory) :
  (factory((global.visUtils = global.visUtils || {}),global.d3));
}(this, (function (exports,d3Array) { 'use strict';

/**
 * Compute the extent (min and max) of an array, limiting the min and the max
 * by the specified percentiles. Percentiles are values between 0 and 1.
 *
 * @param {Array} array The array to iterate over
 * @param {Function} [valueAccessor] How to read a value in the array (defaults to identity)
 * @param {Number} [minPercentile] If provided, limits the min to this percentile value (between 0 and 1).
 *   If provided, the data is sorted by taking the difference of the valueAccessor results.
 * @param {Number} [maxPercentile] If provided, limits the max to this percentile value (between 0 and 1).
 *   If provided, the data is sorted by taking the difference of the valueAccessor results.
 * @return {Array} the extent, limited by the min/max percentiles
 */
function extentLimited(array, valueAccessor, minPercentile, maxPercentile) {
  if ( valueAccessor === void 0 ) valueAccessor = function (d) { return d; };

  if (!array || !array.length) {
    return undefined;
  }

  // neither limits defined, just use d3 extent.
  if (minPercentile == null && maxPercentile == null) {
    return d3Array.extent(array, valueAccessor);
  }

  array.sort(function (a, b) { return valueAccessor(a) - valueAccessor(b); });
  var minValue = array[0];
  var maxValue = array[array.length - 1];
  var bisectValue = d3Array.bisector(valueAccessor).left;

  // limit to minPercentile if passed in
  if (minPercentile != null) {
    // get the value at the percentile
    var minQuantileValue = d3Array.quantile(array, minPercentile, valueAccessor);
    var quantileInsertIndex = Math.max(0, bisectValue(array, minQuantileValue));

    // this may not exist in the array, so find the nearest point to it
    // and use that.
    minValue = valueAccessor(array[quantileInsertIndex]);
  }

  // limit to maxPercentile if passed in
  if (maxPercentile != null) {
    var maxQuantileValue = d3Array.quantile(array, maxPercentile, valueAccessor);
    var quantileInsertIndex$1 = Math.min(array.length - 1, bisectValue(array, maxQuantileValue));

    maxValue = valueAccessor(array[quantileInsertIndex$1]);

    // ensure we do not get a value bigger than the quantile value
    if (maxValue > maxQuantileValue && quantileInsertIndex$1 > 0) {
      maxValue = valueAccessor(array[quantileInsertIndex$1 - 1]);
    }
  }

  return [minValue, maxValue];
}

/**
 * Compute the extent (min and max) across an array of arrays/objects
 *
 * For example:
 * ```
 * extentMulti([[4, 3], [1, 2]], d => d);
 * > 1, 4
 * ```
 * ```
 * extentMulti([{ results: [{ x: 4 }, { x: 3 }] }, { results: [{ x: 1 }, { x: 2 }] }],
 *   d => d.x, array => array.results);
 * > 1, 4
 * ```
 *
 * @param {Array} outerArray An array of arrays or objects
 * @param {Function} [valueAccessor] How to read a value in the array (defaults to identity)
 * @param {Function} [arrayAccessor] How to read an inner array (defaults to identity)
 * @param {Number} [minPercentile] If provided, limits the min to this percentile value (between 0 and 1).
 *   If provided, the data is sorted by taking the difference of the valueAccessor results.
 * @param {Number} [maxPercentile] If provided, limits the max to this percentile value (between 0 and 1).
 *   If provided, the data is sorted by taking the difference of the valueAccessor results.
 * @return {Array} the extent
 */
function extentMulti(outerArray, valueAccessor, arrayAccessor,
    minPercentile, maxPercentile) {
  if ( valueAccessor === void 0 ) valueAccessor = function (d) { return d; };
  if ( arrayAccessor === void 0 ) arrayAccessor = function (d) { return d; };

  if (!outerArray || !outerArray.length) {
    return undefined;
  }

  // flatten the arrays into one big array
  var combined = outerArray.reduce(function (carry, inner) { return carry.concat(arrayAccessor(inner)); }, []);

  return extentLimited(combined, valueAccessor, minPercentile, maxPercentile);
}

var X = 0;
var Y = 1;
var TOP_LEFT = 0;
var BOTTOM_RIGHT = 1;

/**
 * Determines if a point is inside a rectangle. The rectangle is
 * defined by two points:
 *   - the upper left corner (rx1, ry1)
 *   - the bottom right corner (rx2, ry2)
 * Note that it is assumed that the top Y value is less than the bottom Y value.
 *
 * @param {Number[][]} rect The rectangle, a pair of two points
 *    [[x, y], [x, y]]
 * @param {Number[]} point The point ([x, y])
 *
 * @return {Boolean} true if the point is inside the rectangle, false otherwise
 */
function rectContains(rect, point) {
  return rect[TOP_LEFT][X] <= point[X] && point[X] <= rect[BOTTOM_RIGHT][X] &&
         rect[TOP_LEFT][Y] <= point[Y] && point[Y] <= rect[BOTTOM_RIGHT][Y];
}

/**
 * Filters the elements in the passed in array to those that are contained within
 * the specified rectangle.
 *
 * @param {Array} array The input array to filter
 * @param {Number[][]} rect The rectangle, a pair of two points [[x, y], [x, y]]
 * @param {Function} x Function that maps a point in the array to its x value
 *   (defaults to d => d[0])
 * @param {Function} y Function that maps a point in the array to its y value
 *   (defaults to d => d[1])
 *
 * @return {Array} The subset of the input array that is contained within the
 *   rectangle
 */
function filterInRect(array, rect, x, y) {
  if ( x === void 0 ) x = function (d) { return d[0]; };
  if ( y === void 0 ) y = function (d) { return d[1]; };

  return array.filter(function (d) { return rectContains(rect, [x(d), y(d)]); });
}

var X$1 = 0;
var Y$1 = 1;
var TOP_LEFT$1 = 0;
var BOTTOM_RIGHT$1 = 1;

/**
 * Determines if two rectangles intersect. Here a rectangle is defined
 * by its upper left and lower right corners.
 *
 * Note that it is assumed that the top Y value is less than the bottom Y value.
 *
 * @param {Number[][]} rect1 The first rectangle, a pair of two points
 *    [[x, y], [x, y]]
 * @param {Number[][]} rect2 The second rectangle, a pair of two points
 *    [[x, y], [x, y]]
 *
 * @return {Boolean} true if the rectangles intersect, false otherwise
 */
function rectIntersects(rect1, rect2) {
  return (rect1[TOP_LEFT$1][X$1] <= rect2[BOTTOM_RIGHT$1][X$1] &&
          rect2[TOP_LEFT$1][X$1] <= rect1[BOTTOM_RIGHT$1][X$1] &&
          rect1[TOP_LEFT$1][Y$1] <= rect2[BOTTOM_RIGHT$1][Y$1] &&
          rect2[TOP_LEFT$1][Y$1] <= rect1[BOTTOM_RIGHT$1][Y$1]);
}

/**
 * Filters the elements in the passed in quadtree to those that are contained within
 * the specified rectangle.
 *
 * @param {Object} quadtree The input data as a d3-quadtree to filter
 * @param {Number[][]} rect The rectangle, a pair of two points [[x, y], [x, y]]
 * @param {Function} x Function that maps a point in the array to its x value
 *   (defaults to d => d[0])
 * @param {Function} y Function that maps a point in the array to its y value
 *   (defaults to d => d[1])
 *
 * @return {Array} The subset of the input data that is contained within the
 *   rectangle
 */
function filterInRectFromQuadtree(quadtree, rect, x, y) {
  if ( x === void 0 ) x = function (d) { return d[0]; };
  if ( y === void 0 ) y = function (d) { return d[1]; };

  var filtered = [];
  quadtree.visit(function (node, x1, y1, x2, y2) {
    // check that quadtree node intersects
    var overlaps = rectIntersects(rect, [[x1, y1], [x2, y2]]);

    // skip if it doesn't overlap the brush
    if (!overlaps) {
      return true;
    }

    // if this is a leaf node (node.length is falsy), verify it is within the brush
    // we have to do this since an overlapping quadtree box does not guarantee
    // that all the points within that box are covered by the brush.
    if (!node.length) {
      var d = node.data;
      if (rectContains(rect, [x(d), y(d)])) {
        filtered.push(d);
      }
    }

    // return false so that we traverse into branch (only useful for non-leaf nodes)
    return false;
  });

  return filtered;
}

var index = function(haystack, needle, comparator, low, high) {
  var mid, cmp;

  if(low === undefined)
    { low = 0; }

  else {
    low = low|0;
    if(low < 0 || low >= haystack.length)
      { throw new RangeError("invalid lower bound"); }
  }

  if(high === undefined)
    { high = haystack.length - 1; }

  else {
    high = high|0;
    if(high < low || high >= haystack.length)
      { throw new RangeError("invalid upper bound"); }
  }

  while(low <= high) {
    /* Note that "(low + high) >>> 1" may overflow, and results in a typecast
     * to double (which gives the wrong results). */
    mid = low + (high - low >> 1);
    cmp = +comparator(haystack[mid], needle, mid, haystack);

    /* Too low. */
    if(cmp < 0.0)
      { low  = mid + 1; }

    /* Too high. */
    else if(cmp > 0.0)
      { high = mid - 1; }

    /* Key found. */
    else
      { return mid; }
  }

  /* Key not found. */
  return ~low;
};

/**
 * Helper function to compute distance and find the closest item
 * Since it assumes the data is sorted, it does a binary search O(log n)
 *
 * @param {Array} array the input array to search
 * @param {Number} value the value to match against (typically pixels)
 * @param {Function} accessor applied to each item in the array to get equivalent
 *   value to compare against
 * @return {Any} The item in the array that is closest to `value`
 */
function findClosestSorted(array, value, accessor) {
  if ( accessor === void 0 ) accessor = function (d) { return d; };

  // binary search uses the value directly in comparisons, so make sure not to
  // run the accessor on it
  var index$$1 = index(array, value, function (a, b) {
    var aValue = a === value ? value : accessor(a);
    var bValue = b === value ? value : accessor(b);
    return aValue - bValue;
  });


  // index is positive = we found it exactly
  if (index$$1 < 0) {
    // should match first element
    if (index$$1 === -1) {
      index$$1 = 0;
    } else {
      // map back to the input location since the binary search uses -(low + 1) as the result
      index$$1 = -index$$1 - 1;

      // should match last element
      if (index$$1 >= array.length) {
        index$$1 = array.length - 1;
      }
    }
  }

  // this result is always to the right, so see if the one to the left is closer
  // and use it if it is.
  var result = array[index$$1];
  var before = array[index$$1 - 1];
  if (before != null && Math.abs(accessor(result) - value) > Math.abs(accessor(before) - value)) {
    result = before;
  }

  return result;
}

/**
 * Helper function to compute distance and find the closest item
 * Since it assumes the data is unsorted, it does a linear scan O(n).
 *
 * @param {Array} array the input array to search
 * @param {Number} value the value to match against (typically pixels)
 * @param {Function} accessor applied to each item in the array to get equivalent
 *   value to compare against
 * @return {Any} The item in the array that is closest to `value`
 */
function findClosestUnsorted(array, value, accessor) {
  if ( accessor === void 0 ) accessor = function (d) { return d; };

  var closest = null;
  var closestDist = null;

  array.forEach(function (elem) {
    var dist = Math.abs(accessor(elem) - value);
    if (closestDist == null || dist < closestDist) {
      closestDist = dist;
      closest = elem;
    }
  });

  return closest;
}

/**
 * Helper function to find the item that matches this value.
 * Since it assumes the data is sorted, it does a binary search O(log n)
 *
 * @param {Array} array the input array to search
 * @param {Number} value the value to match against (typically pixels)
 * @param {Function} accessor applied to each item in the array to get equivalent
 *   value to compare against
 * @return {Any} The item in the array that has this value or null if not found
 */
function findEqualSorted(array, value, accessor) {
  if ( accessor === void 0 ) accessor = function (d) { return d; };

  // binary search uses the value directly in comparisons, so make sure not to
  // run the accessor on it
  var index$$1 = index(array, value, function (a, b) {
    var aValue = a === value ? value : accessor(a);
    var bValue = b === value ? value : accessor(b);
    return aValue - bValue;
  });
  return array[index$$1];
}

/**
 * Helper function to find the item that matches this value.
 * Since it assumes the data is unsorted, it does a linear scan O(n).
 *
 * @param {Array} array the input array to search
 * @param {Number} value the value to match against (typically pixels)
 * @param {Function} accessor applied to each item in the array to get equivalent
 *   value to compare against
 * @return {Any} The item in the array that has this value or null if not found
 */
function findEqualUnsorted(array, value, accessor) {
  if ( accessor === void 0 ) accessor = function (d) { return d; };

  return array.find(function (d) { return accessor(d) === value; });
}

var X$2 = 0;
var Y$2 = 1;

/**
 * Given the definition of a cubic bezier: a start point, two control points,
 * and end point, return a function that interpolates between the start point
 * and end point following the curve.
 *
 * @param {Number[]} start The start point ([x, y])
 * @param {Number[]} control1 The first control point ([x, y])
 * @param {Number[]} control2 The second control point ([x, y])
 * @param {Number[]} end The end point ([x, y])
 *
 * @return {Function} the interpolating function that maps from 0 <= t <= 1 to
 *   a point on the curve.
 */
function interpolateCubicBezier(start, control1, control2, end) {
  // B(t) = (1 - t)^3P0 + 3(1 - t)^2tP1 + 3(1 - t)t^2P2 + t^3P3
  // 0 <= t <= 1 --> a point on the curve
  return function interpolator(t) {
    return [
      (Math.pow(1 - t, 3) * start[X$2]) +
      (3 * Math.pow(1 - t, 2) * t * control1[X$2]) +
      (3 * (1 - t) * Math.pow(t, 2) * control2[X$2]) +
      (Math.pow(t, 3) * end[X$2]),
      (Math.pow(1 - t, 3) * start[Y$2]) +
      (3 * Math.pow(1 - t, 2) * t * control1[Y$2]) +
      (3 * (1 - t) * Math.pow(t, 2) * control2[Y$2]) +
      (Math.pow(t, 3) * end[Y$2]) ];
  };
}

var X$3 = 0;
var Y$3 = 1;

/**
 * Given the definition of a cubic bezier: a start point, two control points,
 * and end point, return a function that interpolates the angle on the curve.
 * For example, at t = 0, the interpolator returns the angle at the start
 * point, at t = 0.5, it returns the angle midway through the curve and at
 * t = 1 it returns the angle at the end of the curve (useful for things like
 * arrowheads). The angles are in degrees.
 *
 * @param {Number[]} start The start point ([x, y])
 * @param {Number[]} control1 The first control point ([x, y])
 * @param {Number[]} control2 The second control point ([x, y])
 * @param {Number[]} end The end point ([x, y])
 *
 * @return {Function} the interpolating function that maps from 0 <= t <= 1 to
 *   an angle in degrees along the curve.
 */
function interpolateCubicBezierAngle(start, control1, control2, end) {
  // B'(t) = 3(1- t)^2(P1 - P0) + 6(1 - t)t(P2 - P1) + 3t^2(P3 - P2)
  // 0 <= t <= 1 --> the angle on the curve at that point
  return function interpolator(t) {
    var tangentX = (3 * Math.pow(1 - t, 2) * (control1[X$3] - start[X$3])) +
                     (6 * (1 - t) * t * (control2[X$3] - control1[X$3])) +
                     (3 * Math.pow(t, 2) * (end[X$3] - control2[X$3]));
    var tangentY = (3 * Math.pow(1 - t, 2) * (control1[Y$3] - start[Y$3])) +
                     (6 * (1 - t) * t * (control2[Y$3] - control1[Y$3])) +
                     (3 * Math.pow(t, 2) * (end[Y$3] - control2[Y$3]));

    return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
  };
}

var X$4 = 0;
var Y$4 = 1;

/**
 * Given the definition of a quadratic bezier: a start point, control point,
 * and end point, return a function that interpolates between the start point
 * and end point following the curve.
 *
 * @param {Number[]} start The start point ([x, y])
 * @param {Number[]} control The control point ([x, y])
 * @param {Number[]} end The end point ([x, y])
 *
 * @return {Function} the interpolating function that maps from 0 <= t <= 1 to
 *   a point on the curve.
 */
function interpolateQuadraticBezier(start, control, end) {
  // B(t) = (1 - t)^2P0 + 2(1 - t)tP1 + t^2P2
  // 0 <= t <= 1 --> a point on the curve
  return function interpolator(t) {
    return [
      (Math.pow(1 - t, 2) * start[X$4]) +
      (2 * (1 - t) * t * control[X$4]) +
      (Math.pow(t, 2) * end[X$4]),
      (Math.pow(1 - t, 2) * start[Y$4]) +
      (2 * (1 - t) * t * control[Y$4]) +
      (Math.pow(t, 2) * end[Y$4]) ];
  };
}

var X$5 = 0;
var Y$5 = 1;

/**
 * Given the definition of a quadratic bezier: a start point, control point,
 * and end point, return a function that interpolates the angle on the curve.
 * For example, at t = 0, the interpolator returns the angle at the start
 * point, at t = 0.5, it returns the angle midway through the curve and at
 * t = 1 it returns the angle at the end of the curve (useful for things like
 * arrowheads). The angles are in degrees.
 *
 * @param {Number[]} start The start point ([x, y])
 * @param {Number[]} control The control point ([x, y])
 * @param {Number[]} end The end point ([x, y])
 *
 * @return {Function} the interpolating function that maps from 0 <= t <= 1 to
 *   an angle in degrees along the curve.
 */
function interpolateQuadraticBezierAngle(start, control, end) {
  // B'(t) = 2(1 - t)(P1 - P0) + 2t(P2 - P1)
  // 0 <= t <= 1 --> the angle on the curve at that point
  return function interpolator(t) {
    var tangentX = (2 * (1 - t) * (control[X$5] - start[X$5])) +
                     (2 * t * (end[X$5] - control[X$5]));
    var tangentY = (2 * (1 - t) * (control[Y$5] - start[Y$5])) +
                     (2 * t * (end[Y$5] - control[Y$5]));

    return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
  };
}

var X$6 = 0;
var Y$6 = 1;

/**
 * Rotate a point ([x, y]) around an origin ([x, y]) by theta radians
 *
 * @param {Number[]} point [x, y]
 * @param {Number} thetaRadians How many radians to rotate the point around origin
 * @param {Number[]} [origin] [x, y] (defaults to [0, 0])
 *
 * @return {Number[]} The rotated point [x, y]
 */
function rotate(point, thetaRadians, origin) {
  if ( origin === void 0 ) origin = [0, 0];

  var rotatedEndX = origin[X$6] +
    (point[X$6] - origin[X$6]) * Math.cos(thetaRadians) -
    (point[Y$6] - origin[Y$6]) * Math.sin(thetaRadians);
  var rotatedEndY = origin[Y$6] +
    (point[X$6] - origin[X$6]) * Math.sin(thetaRadians) +
    (point[Y$6] - origin[Y$6]) * Math.cos(thetaRadians);

  return [rotatedEndX, rotatedEndY];
}

exports.extentLimited = extentLimited;
exports.extentMulti = extentMulti;
exports.filterInRect = filterInRect;
exports.filterInRectFromQuadtree = filterInRectFromQuadtree;
exports.findClosestSorted = findClosestSorted;
exports.findClosestUnsorted = findClosestUnsorted;
exports.findEqualSorted = findEqualSorted;
exports.findEqualUnsorted = findEqualUnsorted;
exports.interpolateCubicBezier = interpolateCubicBezier;
exports.interpolateCubicBezierAngle = interpolateCubicBezierAngle;
exports.interpolateQuadraticBezier = interpolateQuadraticBezier;
exports.interpolateQuadraticBezierAngle = interpolateQuadraticBezierAngle;
exports.rectContains = rectContains;
exports.rectIntersects = rectIntersects;
exports.rotate = rotate;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=vis-utils.js.map
