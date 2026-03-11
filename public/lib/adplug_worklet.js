/**
 * AudioWorkletProcessor for webAdPlug OPL2 playback.
 *
 * Receives pre-generated PCM chunks from the main thread via MessagePort
 * and outputs them to the Web Audio graph, replacing the deprecated
 * ScriptProcessorNode.
 *
 * Protocol (main thread → worklet):
 *   { type: 'cfg',   channels: Number }          — configure channel count
 *   { type: 'chunk', ch0: Float32Array,           — audio chunk (transferred)
 *                    ch1?: Float32Array }
 */
class AdPlugProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._queue   = [];   // queued { ch0, ch1? } chunks
        this._offset  = 0;   // read position within queue[0]
        this._channels = 1;

        this.port.onmessage = ({ data }) => {
            if (data.type === 'cfg') {
                this._channels = data.channels;
            } else if (data.type === 'chunk') {
                this._queue.push(data);
            }
        };
    }

    process(inputs, outputs) {
        const out        = outputs[0];
        const frameCount = out[0].length;   // 128 samples per call
        let   written    = 0;

        while (written < frameCount) {
            if (this._queue.length === 0) {
                // Buffer underrun — output silence for remaining frames
                for (let ch = 0; ch < out.length; ch++) {
                    out[ch].fill(0, written);
                }
                break;
            }

            const chunk     = this._queue[0];
            const available = chunk.ch0.length - this._offset;
            const toCopy    = Math.min(available, frameCount - written);

            out[0].set(chunk.ch0.subarray(this._offset, this._offset + toCopy), written);
            if (out.length > 1) {
                // Duplicate left channel to right if mono source
                const src = chunk.ch1 || chunk.ch0;
                out[1].set(src.subarray(this._offset, this._offset + toCopy), written);
            }

            written       += toCopy;
            this._offset  += toCopy;

            if (this._offset >= chunk.ch0.length) {
                this._queue.shift();
                this._offset = 0;
            }
        }

        return true; // keep processor alive
    }
}

registerProcessor('adplug-processor', AdPlugProcessor);
