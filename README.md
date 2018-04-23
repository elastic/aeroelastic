# aeroelastic

Transformations library for common layout editing functions [WIP]

Due to using modules, a build tool is needed, for example, a _recent_ version of `budo`:

```
npm install -g budo
budo --live --open --host localhost example.js
```

![aeroelastic](https://user-images.githubusercontent.com/1548516/38812286-3116ca22-418c-11e8-818b-afd4bc0e8f27.gif)

Building support for

- [x] drag and drop
- [ ] rotation, resize
- [x] snap to grid
- [x] implicit snap lines to match other shapes horizontally or vertically
- [ ] distribution, eg. space selected shapes evenly
- [ ] anchoring, ie. anchor the shapes at their left/center/right, top/middle/bottom or corner points
- [ ] alignment, eg. common left/center/right, top/middle/bottom adjustment relative to the same horizontal or vertical guide line
- [ ] group, ungroup
- [ ] zoom
- [ ] general projective transforms
- [ ] responsive layout

Main building blocks of the PoC:

- a self-contained scenegraph representation which models shapes and transient state (eg. zoom level or drag&drop phase)
- mock data, pure React DOM fragment makers and pointer event pipelining for visualizing during development

## Inspiration

[StickyLines](https://www.youtube.com/watch?v=0msyWHrw40A), a research by Marianela Ciolfi Felice, Nolwenn Maudet, Wendy E. Mackay and Michel Beaudouin-Lafon are a main inspiration. See also [Designing Design Tools](http://www.designing-design-tools.nolwennmaudet.com/) by [Nolwenn Maudet](http://phd.nolwennmaudet.com/). Even though the described affordances aren't currently targeted for implementation, it presents a great framework for modeling shape alignment, adjustment, distribution and other common visual editing functionality, so related functions are being added. The user of the library may or may not use the controls at the granularity of per-dimension constraints, but as they're implementational stepping stones, they're exposed during the prototyping stage.


## Concepts

The initially implemented guide lines can be the implementation basis for many of the listed functions (drag&drop with snap to grid, to shape or to implicit snap guides; distribution, anchoring and alignment). Grouping / ungrouping can be thought of being constrained along (perhaps invisible) horizontal and vertical lines, ie. similar to snapping, except for both dimensions, and acting as a hard constraint (while snaps are breakable connections). A lot of very common layout functions, present in Adobe Illustrator, Powerpoint etc. already deal with a single dimension at a time, eg. alignments. This approach may be handy for an eventual responsive layout too.

Depending on the performance needs (platform, number of shapes etc.) it can be useful to _incrementally_ update the state, ie. a new piece of input doesn't typically involve the recalculation of the entire state, and the entire output (be it a DOM graph or a representative JSON object). Therefore we currently use memoized selectors called `map` analogous to `createSelector` in `reselect`. The improvement is that selectors can also be reducers (`reduce` instead of `map`) ie. a reducer function can use the previous value of the selection, which is memoized anyway - this has performance benefit with high frequency, transient updates eg. mouse interactions, and code is more localized compared to the alternative of persisting all transient state on a singleton state object.

The distinction between `commit` and `dispatch` is similar to the difference in `Vuex` - the former implies synchronous state update while the latter is asynchronous. Currently, an asynchronous action can commit only one update ("mutation" would be a misnomer, as currently a fresh state is generated, with possible _structural sharing_) but this can be generalized to more, if needed.

The transform selectors (`map` and `reduce` functions) might be exchanged with reactive versions (analogous to `Vue`/`Vuex`, `ObservableHQ`, `RxJS`/`Angular 2`, `most.js`, `crosslink`, TC39 observables etc.) although for the current workload (manipulation of up to several dozens of rectangles) it's likely unnecessary, therefore the current style is closer to `redux` with `reselect`. As an alternative, if performance desires so, it can follow `Vuex` in that the state is _mutated_ instead of always generating a fresh state.


## Build approach

Modern tooling requires that on one hand, development can be done with current or even evolving standards, and on the other, the user deployment, and therefore automated testing, be done on ES5 code, so that it runs even in Internet Explorer which Microsoft no longer improves functionally. The entire code transform typically includes transpilers such as Babel or Bublé, minification, optimization (Google Closure, Rollup or now Webpack treeshaking), code splitting and of course, assembling the code from ES2015 or CommonJS modules.

Even with moderate code size on modern hardware, this can lead to seconds of code transform time, which can be jarring during very quick iterations of code change and seeing the effect.

In the meantime, evergreen browsers (Chrome, Firefox, Edge, Safari) now support most of the ES2015 standard. Therefore it is possible to avoid most of the code transformations while doing _development_, and leave them until test running and code publishing time. This ensures instant availability in the browser (eg. instant reload with `budo`/`Webpack`) or simply, being able to refresh the browser page without counting to some number (conservatively more, so as not to get stale code), or monitoring the OS console or other notification (or simply wait for `Webpack` to reload). Zero-second refresh instead of a (stochastic) two-second wait time sounds like a negligible improvement but it lets some of the people to be in the groove while coding.

This is why the library doesn't do code transformation other than the instantaneous module bundling via `browserify` behind `budo`. We might switch to ES2015 modules in the future.

The test and build approach (devDependencies, tooling etc.) will be patterned after https://github.com/elastic/tinymath but minute by minute development should require no time consuming code transformation.


## Notes

Although the current version switched to modules, it's not fully structured yet; pure math functions will be extracted into their own module, and transient layout state (eg. mouse interactions, drag&drop gesture data etc.) will be separated from more persistent data ie. the scene elements with their projection data.

Since the last implementation step aimed at the removal of reactive dataflow (`crosslink`) and code structuring, and few functions were added, the persistent state structures are by no means final, they're unchanged now, only specifying size and translation. But it's coming up next :-)

(to be continued)