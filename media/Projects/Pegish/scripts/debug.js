// Debug utilities for Pegish game
export const debug = {
    enabled: false, // Disabled by default in production
    debugFrameCounter: 0,
    debugFrameInterval: 60, // Log every 60 frames
    
    log: function(...args) {
        if (this.enabled) {
            console.log(...args);
        }
    },
    
    error: function(...args) {
        if (this.enabled) {
            console.error(...args);
        }
    },
    
    showPosition: function(context, x, y, label = '') {
        if (!this.enabled) return;
        
        try {
            context.save();
            context.fillStyle = 'red';
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2);
            context.fill();
            
            if (label) {
                context.fillStyle = 'white';
                context.font = '12px Arial';
                context.fillText(`${label} (${Math.round(x)}, ${Math.round(y)})`, x + 8, y);
            }
            
            context.restore();
        } catch (error) {
            console.error("Error in showPosition:", error);
        }
    },
    
    debugObject: function(obj, name = 'Object') {
        if (!this.enabled) return;
        
        try {
            console.log(`======== DEBUG ${name} ========`);
            for (const prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    const value = obj[prop];
                    if (typeof value !== 'function') {
                        console.log(`${prop}: ${value}`);
                    } else {
                        console.log(`${prop}: [Function]`);
                    }
                }
            }
            console.log(`======== END ${name} ========`);
        } catch (error) {
            console.error("Error in debugObject:", error);
        }
    },
    
    // Track objects over time (especially useful for canvas objects and positions)
    trackObject: function(obj, name = 'Tracked Object') {
        if (!this.enabled) return obj;
        
        this.debugFrameCounter++;
        
        if (this.debugFrameCounter % this.debugFrameInterval === 0) {
            console.log(`[TRACKING ${name} - Frame ${this.debugFrameCounter}]`);
            this.debugObject(obj, name);
        }
        
        return obj;
    },
    
    // For debugging canvas size issues
    debugCanvas: function(canvas) {
        if (!this.enabled) return;
        
        try {
            console.log('=== CANVAS DEBUG INFO ===');
            console.log(`HTML attributes: width=${canvas.getAttribute('width')}, height=${canvas.getAttribute('height')}`);
            console.log(`DOM properties: width=${canvas.width}, height=${canvas.height}`);
            console.log(`Client dimensions: width=${canvas.clientWidth}, height=${canvas.clientHeight}`);
            console.log('=== END CANVAS DEBUG ===');
        } catch (error) {
            console.error("Error in debugCanvas:", error);
        }
    },
    
    // Debug canvas and context drawing state
    debugCanvasState: function(context) {
        if (!this.enabled) return;
        
        try {
            console.log('=== CANVAS CONTEXT STATE ===');
            console.log(`fillStyle: ${context.fillStyle}`);
            console.log(`strokeStyle: ${context.strokeStyle}`);
            console.log(`lineWidth: ${context.lineWidth}`);
            console.log(`globalAlpha: ${context.globalAlpha}`);
            console.log('=== END CANVAS CONTEXT STATE ===');
        } catch (error) {
            console.error("Error in debugCanvasState:", error);
        }
    }
};
