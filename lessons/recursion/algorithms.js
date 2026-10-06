// Snapshots pause BEFORE the highlighted Python line executes.
export function hanoiTrace(n) {
  if (!Number.isInteger(n) || n < 1 || n > 6) throw new RangeError('Choose 1–6 disks.');
  const pegs = {A:Array.from({length:n}, (_,i)=>n-i), B:[], C:[]};
  const frames=[], moves=[], stdout=[], steps=[];
  const emit=(line,text,kind='line')=>steps.push({line,text,kind,pegs:structuredClone(pegs),moves:structuredClone(moves),stdout:[...stdout],stack:structuredClone(frames)});
  const move=(n,source,destination)=>{pegs[source].pop();pegs[destination].push(n);moves.push([n,source,destination]);stdout.push(`Move disk ${n} from source ${source} to destination ${destination}`);};
  function visit(n,source,destination,auxiliary) {
    frames.push({name:`TowerOfHanoi(${n}, "${source}", "${destination}", "${auxiliary}")`,locals:{n,source,destination,auxiliary}});
    emit(2,`Check whether n (${n}) equals 1.`);
    if(n===1){emit(3,`Print the move of disk 1 from ${source} to ${destination}.`,'move');move(n,source,destination);emit(4,'Return None to the caller.','base');frames.pop();return;}
    emit(5,`Move ${n-1} disks from ${source} to ${auxiliary}.`,'call');visit(n-1,source,auxiliary,destination);
    emit(6,`Print the move of disk ${n} from ${source} to ${destination}.`,'move');move(n,source,destination);
    emit(7,`Move ${n-1} disks from ${auxiliary} to ${destination}.`,'call');visit(n-1,auxiliary,destination,source);frames.pop();
  }
  visit(n,'A','C','B');emit(null,`Complete: ${moves.length} printed moves. All ${n} disks are on C; every call has returned.`,'done');return steps;
}
export const DEFAULT_MAZE = [[0,0,0,0,0,1],[1,1,0,0,0,1],[0,0,0,1,0,0],[0,1,1,0,0,1],[0,1,0,0,1,0],[0,1,0,0,0,2]];
export function mazePreset(name) {
 const grid=structuredClone(DEFAULT_MAZE);
 if(name==='blocked'){grid[5][4]=1;grid[4][5]=1;}
 if(name==='open') for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(grid[r][c]!==2)grid[r][c]=0;
 return grid;
}
export function mazeTrace(input) {
 const grid=structuredClone(input),frames=[],steps=[],stdout=[];
 const emit=(line,text,kind='line')=>{const snapshot=structuredClone(grid);steps.push({line,text,kind,maze:snapshot,stdout:[...stdout],stack:frames.map(({x,y})=>({name:`mazeSearch(grid, ${x}, ${y})`,locals:{grid:snapshot,x,y}})),current:frames.length?[frames.at(-1).y,frames.at(-1).x]:null});};
 function search(x,y){
  frames.push({x,y});
  emit(3,'Check for a wall (1).');
  if(grid[y][x]===1){emit(4,'Print the wall position.');stdout.push(`Hit a wall at position (${y}, ${x})`);emit(5,'Return False.','base');frames.pop();return false;}
  emit(6,'Check for the end (2).');
  if(grid[y][x]===2){emit(7,'Print the end position.');stdout.push(`Found the end at position (${y}, ${x})`);emit(8,'Return True.','success');frames.pop();return true;}
  emit(9,'Check for an already visited cell (3).');
  if(grid[y][x]===3){emit(10,'Print the already visited position.');stdout.push(`Hit an already visited cell at position (${y}, ${x})`);emit(11,'Return False.','base');frames.pop();return false;}
  emit(13,'Print the position being visited.');stdout.push(`Visiting cell at position (${y}, ${x})`);
  emit(14,'Mark this cell visited (3).');grid[y][x]=3;
  for(const [dx,dy,line,label,allowed] of [[1,0,17,'right',x+1<grid.length],[0,1,18,'down',y+1<grid.length],[-1,0,19,'left',x-1>=0],[0,-1,20,'up',y-1>=0]]){
   emit(line,`Check the ${label} boundary, then search if allowed.`,'call');
   if(allowed&&search(x+dx,y+dy)){emit(21,'A child found the end. Short-circuit the remaining directions and return True.','return');frames.pop();return true;}
  }
  emit(22,'All directions failed. Return False; visited marks remain.','backtrack');frames.pop();return false;
 }
 const found=search(0,0);emit(null,found?'Found the end. Visited marks remain; they are not a saved solution path.':'No route found. Every reachable open cell remains marked 3.','done');steps.at(-1).found=found;return steps;
}
