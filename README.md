# aeroelastic

Transformations library for common layout editing functions [WIP]

The current version needs no build tools as the dependencies are now just script inclusions, so opening the `index.html` should work. Alternatively, for instantaneous browser reload:

```
npm install -g budo
budo --live --open --host localhost index.js
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

Depending on the performance needs (platform, number of shapes etc.) it can be useful to _incrementally_ update the state, ie. a new piece of input doesn't typically involve the recalculation of the entire state, and the entire output (be it a DOM graph or a representative JSON object) so it's currently using a model dependency graph [microlibrary](https://github.com/monfera/crosslink) involving topological sorting of what needs to be recomputed. Besides the performance considerations, which may not be stringent, it's useful if the code mirrors the conceptual links between originating input and downstream consequences. The approach uses reducers and lifted functions (same as reducers except they don't use the previous state) which are independent of the specific microlibrary and other approaches may work as well.

(to be continued)