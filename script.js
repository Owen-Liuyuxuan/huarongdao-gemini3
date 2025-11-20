/* --- 配置与状态 --- */
const ROWS = 5;
const COLS = 4;
const BLOCK_SIZE = 80; 

// 图片配置
const IMAGES = {
    caocao: 'images/caocao.png',
    guanyu: 'images/guanyu.png',
    zhangfei: 'images/zhangfei.png',
    zhaoyun: 'images/zhaoyun.png',
    machao: 'images/machao.png',
    huangzhong: 'images/huangzhong.png',
    soldier: 'images/shibing.png'
};

// 初始布局
const INITIAL_LAYOUT = [
    { id: 'cc', type: 3, w: 2, h: 2, x: 1, y: 0, name: '曹操', img: IMAGES.caocao },
    { id: 'gy', type: 2, w: 2, h: 1, x: 1, y: 2, name: '关羽', img: IMAGES.guanyu },
    { id: 'zf', type: 1, w: 1, h: 2, x: 0, y: 0, name: '张飞', img: IMAGES.zhangfei },
    { id: 'zy', type: 1, w: 1, h: 2, x: 3, y: 0, name: '赵云', img: IMAGES.zhaoyun },
    { id: 'mc', type: 1, w: 1, h: 2, x: 0, y: 2, name: '马超', img: IMAGES.machao },
    { id: 'hz', type: 1, w: 1, h: 2, x: 3, y: 2, name: '黄忠', img: IMAGES.huangzhong },
    { id: 's1', type: 0, w: 1, h: 1, x: 0, y: 4, name: '卒', img: IMAGES.soldier },
    { id: 's2', type: 0, w: 1, h: 1, x: 1, y: 3, name: '卒', img: IMAGES.soldier },
    { id: 's3', type: 0, w: 1, h: 1, x: 2, y: 3, name: '卒', img: IMAGES.soldier },
    { id: 's4', type: 0, w: 1, h: 1, x: 3, y: 4, name: '卒', img: IMAGES.soldier }
];

let blocks = [];
let selectedBlockId = null;

/* --- 游戏核心逻辑 --- */

function initGame() {
    // 使用更高效的深拷贝
    blocks = cloneBlocks(INITIAL_LAYOUT);
    createBoardElements();
    updateStatus("请点将，再行军");
}

function createBoardElements() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    blocks.forEach(block => {
        const el = document.createElement('div');
        el.id = `block-${block.id}`;
        el.className = 'block';
        el.style.width = (block.w * BLOCK_SIZE) + 'px';
        el.style.height = (block.h * BLOCK_SIZE) + 'px';
        el.style.backgroundImage = `url('${block.img}')`;
        el.onclick = (e) => {
            e.stopPropagation();
            selectBlock(block.id);
        };
        boardEl.appendChild(el);
    });
    updateBlockPositions();
}

function updateBlockPositions() {
    blocks.forEach(block => {
        const el = document.getElementById(`block-${block.id}`);
        if (el) {
            el.style.left = (block.x * BLOCK_SIZE) + 'px';
            el.style.top = (block.y * BLOCK_SIZE) + 'px';
            if (block.id === selectedBlockId) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        }
    });

    const cc = blocks.find(b => b.id === 'cc');
    if (cc.x === 1 && cc.y === 3) {
        setTimeout(() => alert("丞相已成功脱险！"), 250);
    }
}

function selectBlock(id) {
    selectedBlockId = id;
    updateBlockPositions();
    updateStatus(`已选中：${blocks.find(b=>b.id===id).name}`);
}

function handlePadMove(dx, dy) {
    if (!selectedBlockId) {
        updateStatus("请先点击棋盘选择武将");
        shakeBoard();
        return;
    }
    const block = blocks.find(b => b.id === selectedBlockId);
    // 生成当前的占用地图用于检测
    const grid = createGridMap(blocks);
    
    if (canMoveFast(block, dx, dy, grid)) {
        block.x += dx;
        block.y += dy;
        updateBlockPositions();
        updateStatus("");
    } else {
        updateStatus("此路不通！");
    }
}

// 快速检测移动 (优化版)
function canMoveFast(block, dx, dy, grid) {
    const newX = block.x + dx;
    const newY = block.y + dy;

    // 1. 边界检查
    if (newX < 0 || newX + block.w > COLS) return false;
    if (newY < 0 || newY + block.h > ROWS) return false;

    // 2. 碰撞检查
    // 我们检查新位置占用的每个格子
    // 如果格子里的 ID 不为 0 (空) 且 不等于当前棋子本身的 ID (1)，则为碰撞
    // 注意：在 createGridMap 中，为了方便，所有被占用的格子值都设为 1
    // 所以我们需要先把当前棋子从逻辑上“拿走”再检查，或者直接检查目标格
    
    // 更简单的方法：直接检查目标格子是否为空（0）或者是否是自己占用的
    // 但为了通用性，我们在传入的 grid 中应该排除自己？
    // 不，我们在外部循环处理比较复杂。
    // 最快的方法：遍历当前 block 的新坐标，看 grid[y][x] 是否被 *其他* block 占用。
    
    // 为了性能，这里我们重新实现一个极其轻量的检测，不依赖外部大 Grid
    // 这种局部检测比维护全局 Grid 更适合少量移动
    for (let other of blocks) {
        if (other.id === block.id) continue;
        // AABB 碰撞检测 (Axis-Aligned Bounding Box)
        if (newX < other.x + other.w &&
            newX + block.w > other.x &&
            newY < other.y + other.h &&
            newY + block.h > other.y) {
            return false;
        }
    }
    return true;
}

// 键盘支持
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') handlePadMove(0, -1);
    if (e.key === 'ArrowDown') handlePadMove(0, 1);
    if (e.key === 'ArrowLeft') handlePadMove(-1, 0);
    if (e.key === 'ArrowRight') handlePadMove(1, 0);
});

/* --- 高性能 AI 算法 (BFS) --- */

async function getAIHint() {
    const hintBtn = document.getElementById('hint-text');
    hintBtn.innerText = "军师推演中...";
    // updateStatus("军师正在穷尽变数 (计算量较大，请稍候)...");

    // 强制让出主线程，让 UI 渲染出文字
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const solution = solveBFS();
        if (solution) {
            const nextState = solution[0]; // 只需要第一步
            const move = findDiff(blocks, nextState);
            
            hintBtn.innerText = "锦囊妙计";
            updateStatus(`军师建议：${move.name} ${move.dir}`);
            
            // 选中
            selectedBlockId = move.id;
            // // 更新数据
            // blocks = nextState; 
            // // 刷新界面
            createBoardElements(); // 重新生成以确保数据同步
            // updateStatus(`军师建议：${move.name} ${move.dir} (已自动执行)`);
        } else {
            hintBtn.innerText = "无解";
            updateStatus("军师叹道：此局似乎已入死胡同。");
        }
    } catch (e) {
        console.error(e);
        hintBtn.innerText = "计算超时";
        updateStatus("计算量过大，军师累倒了。");
    }
}

function solveBFS() {
    // 1. 初始化队列
    // 队列存对象：{ blocks: Array, firstMove: Array | null }
    // path 我们只需要存第一步的状态即可，不需要存整个链条，节省海量内存
    let startBlocks = cloneBlocks(blocks);
    let queue = [{ blocks: startBlocks, firstMove: null }];
    
    // 2. 初始化访问记录 (Set)
    let visited = new Set();
    visited.add(encodeState(startBlocks));

    let iterations = 0;
    const MAX_ITER = 200000; // 提升到 20万次，足以解决横刀立马

    // 预分配重用变量，减少 GC
    const moves = [[0,-1], [0,1], [-1,0], [1,0]]; // 上下左右

    while(queue.length > 0) {
        iterations++;
        if (iterations > MAX_ITER) break;

        // 取出队首
        // 优化：由于这是 JS 数组 shift 很慢，在生产环境通常用指针，但这里数据量还可以接受
        let current = queue.shift(); 
        let currBlocks = current.blocks;

        // 检查胜利 (曹操位置 1,3)
        // 曹操在数组第一个(index 0) 如果没有打乱顺序的话，但为了保险用 find
        // 优化：我们知道初始化时曹操 id 是 'cc'
        let cc = currBlocks.find(b => b.id === 'cc');
        if (cc.x === 1 && cc.y === 3) {
            // 找到了！返回引发这个结果的第一步状态
            // 如果 firstMove 是 null，说明只走了一步就赢了（虽然不可能）
            return current.firstMove ? [current.firstMove] : [currBlocks];
        }

        // 生成当前状态的占用网格 (Bitmask思想，用一维数组)
        // 0 = 空, 1 = 占
        let grid = new Int8Array(20).fill(0);
        for(let b of currBlocks) {
            for(let i=0; i<b.h; i++) {
                for(let j=0; j<b.w; j++) {
                    grid[(b.y+i)*4 + (b.x+j)] = 1;
                }
            }
        }

        // 遍历每个滑块尝试移动
        for (let i = 0; i < currBlocks.length; i++) {
            let b = currBlocks[i];
            
            for (let move of moves) {
                let dx = move[0];
                let dy = move[1];
                let nx = b.x + dx;
                let ny = b.y + dy;

                // 快速检测逻辑：
                // 1. 越界检测
                if (nx < 0 || nx + b.w > COLS || ny < 0 || ny + b.h > ROWS) continue;

                // 2. 碰撞检测 (利用 grid)
                // 只有当目标格子被 *其他人* 占用时才不行
                // 但 grid 里包含了自己。
                // 技巧：只检查“新进入”的边缘。
                // 或者：简单粗暴地，先检查 grid 对应位置，如果为 1，再看是不是通过“平移”其实是自己的位置？
                // 最稳健方法：在生成 grid 时排除自己？太慢。
                // 修正方法：检查目标区域的所有格子。如果该格子为 1，且该格子 *不是* 自己当前占据的格子，则碰撞。
                
                let collision = false;
                for(let h=0; h<b.h; h++) {
                    for(let w=0; w<b.w; w++) {
                        let targetIdx = (ny+h)*4 + (nx+w);
                        if (grid[targetIdx] === 1) {
                            // 它是被占用的，但被谁占用的？
                            // 检查这个 targetIdx 是否在 b 的原始范围内
                            // b 的原始范围：[b.x, b.x+b.w-1] x [b.y, b.y+b.h-1]
                            let isSelf = (nx+w >= b.x && nx+w < b.x+b.w && ny+h >= b.y && ny+h < b.y+b.h);
                            if (!isSelf) {
                                collision = true;
                                break; 
                            }
                        }
                    }
                    if (collision) break;
                }

                if (!collision) {
                    // 可以移动！创建新状态
                    // 极速克隆：我们只浅拷贝数组，然后克隆移动的那个对象
                    let newBlocks = currBlocks.map(bl => ({...bl})); 
                    newBlocks[i].x = nx;
                    newBlocks[i].y = ny;

                    let stateCode = encodeState(newBlocks);
                    if (!visited.has(stateCode)) {
                        visited.add(stateCode);
                        // 记录第一步
                        let nextFirstMove = current.firstMove ? current.firstMove : newBlocks;
                        queue.push({ blocks: newBlocks, firstMove: nextFirstMove });
                    }
                }
            }
        }
    }
    return null;
}

/* --- 工具函数 --- */

// 深度克隆 Blocks (比 JSON 更快)
function cloneBlocks(source) {
    return source.map(b => ({...b}));
}

// 生成占用地图 (辅助)
function createGridMap(blks) {
    // 为了外部 handlePadMove 使用，依然返回之前的结构或直接不用
    // 这里只做占位，handlePadMove 已经改用即时计算了
    return null; 
}

// 状态压缩 (唯一标识符)
function encodeState(blkList) {
    // 创建一个长度20的字符串代表棋盘
    // 0=空, 1=曹, 2=关, 3=张赵马黄(竖), 4=卒
    // 注意：所有的竖将视为同一种东西，所有的卒视为同一种东西，这是去重的关键！
    // 如果不这样做，交换两个卒会被视为新状态，导致搜索空间爆炸。
    
    let grid = new Uint8Array(20).fill(0);
    
    // 先填入数据
    for (let b of blkList) {
        let code = 0;
        if (b.w === 2 && b.h === 2) code = 1; // 曹操
        else if (b.w === 2 && b.h === 1) code = 2; // 关羽
        else if (b.w === 1 && b.h === 2) code = 3; // 竖将
        else if (b.w === 1 && b.h === 1) code = 4; // 卒

        for(let i=0; i<b.h; i++) {
            for(let j=0; j<b.w; j++) {
                grid[(b.y+i)*4 + (b.x+j)] = code;
            }
        }
    }
    return grid.join('');
}

// 找出哪一步变化
function findDiff(current, next) {
    for(let i=0; i<current.length; i++) {
        // 比较坐标
        if (current[i].x !== next[i].x || current[i].y !== next[i].y) {
            let dx = next[i].x - current[i].x;
            let dy = next[i].y - current[i].y;
            let dir = "";
            if (dy < 0) dir = "⬆️ 向上";
            if (dy > 0) dir = "⬇️ 向下";
            if (dx < 0) dir = "⬅️ 向左";
            if (dx > 0) dir = "➡️ 向右";
            return { name: current[i].name, dir: dir, id: current[i].id };
        }
    }
    return { name: "", dir: "", id: null };
}

function updateStatus(msg) {
    document.getElementById('msg-area').innerText = msg;
}

function shakeBoard() {
    const b = document.getElementById('board');
    b.style.transform = "translateX(5px)";
    setTimeout(() => b.style.transform = "translateX(-5px)", 50);
    setTimeout(() => b.style.transform = "translate(0)", 100);
}

function closeStory() {
    document.getElementById('storyModal').classList.remove('active');
}

function resetGame() {
    if(confirm("重新布阵？")) initGame();
}

function toggleAlgo() {
    document.getElementById('algoDetails').classList.toggle('show');
}

// 启动
initGame();