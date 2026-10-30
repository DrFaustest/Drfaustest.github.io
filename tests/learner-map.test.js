import {replay,stories,concepts} from '../learner-map/model.js';

test('native explanatory replay preserves prior, update ordering, and immutable snapshots',()=>{
  const frames=replay(stories.practice.events);
  expect(frames[0].A).toMatchObject({n:0,s:0,d:0.5,g:0.5,last:null});
  expect(frames[1].A).toMatchObject({n:1,s:0,d:1/3,last:1});
  expect(frames[0].A.n).toBe(0);
  // Changing a future outcome cannot alter any earlier state.
  const changed=structuredClone(stories.practice.events);changed[11].correct=1;
  expect(replay(changed).slice(0,12)).toEqual(frames.slice(0,12));
});

test('neighbor-only story moves the smoothed estimate with zero focal practice',()=>{
  const frames=replay(stories.neighbors.events);
  for(const frame of frames) expect(frame.A).toMatchObject({n:0,s:0,d:0.5,last:null});
  expect(frames[9].A.g).toBeGreaterThan(0.5);
  expect(frames[12].A.g).toBeLessThan(frames[9].A.g);
  expect(frames[1].A.g).toBeCloseTo(0.8*0.5+0.2*((2/3+0.5)/2),14);
});

test('a multi-tag response updates each tagged concept once; recency does not decay counts',()=>{
  const frames=replay([{tags:['A','A','B'],correct:1,day:1},{tags:['C'],correct:0,day:999}]);
  expect(frames[1].A.n).toBe(1);expect(frames[1].B.n).toBe(1);
  expect(frames[2].A.d).toBe(frames[1].A.d);expect(frames[2].A.n).toBe(1);
});

test('each scripted state obeys the count formula and estimate bounds',()=>{
  for(const story of Object.values(stories)) for(const frame of replay(story.events)) for(const {id} of concepts) {
    const state=frame[id];expect(state.d).toBe((1+state.s)/(2+state.n));
    expect(state.g).toBeGreaterThanOrEqual(0);expect(state.g).toBeLessThanOrEqual(1);
    expect(state.g).toBeCloseTo(0.8*state.d+0.2*state.neighbor,14);
    expect(state.recent.length).toBeLessThanOrEqual(5);
  }
});
