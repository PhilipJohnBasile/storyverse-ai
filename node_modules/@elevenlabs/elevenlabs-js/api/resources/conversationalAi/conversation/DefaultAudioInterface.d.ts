import { AudioInterface } from "./AudioInterface";
/**
 * Default audio interface implementation for Node.js using basic audio processing.
 *
 * Note: This is a basic implementation. For production use, consider using
 * professional audio libraries like 'naudiodon', 'mic'/'speaker', or similar.
 *
 * This implementation provides a foundation that can be extended with actual
 * audio capture and playback capabilities.
 */
export declare class DefaultAudioInterface extends AudioInterface {
    private static readonly INPUT_FRAMES_PER_BUFFER;
    private static readonly OUTPUT_FRAMES_PER_BUFFER;
    private static readonly SAMPLE_RATE;
    private static readonly CHANNELS;
    private inputCallback?;
    private outputQueue;
    private shouldStop;
    private inputInterval?;
    private outputInterval?;
    /**
     * Starts the audio interface.
     *
     * @param inputCallback Function to call with audio chunks from the microphone
     */
    start(inputCallback: (audio: Buffer) => void): void;
    /**
     * Stops the audio interface and cleans up resources.
     */
    stop(): void;
    /**
     * Output audio to the user.
     *
     * @param audio Audio data to output to the speaker
     */
    output(audio: Buffer): void;
    /**
     * Interruption signal to stop any audio output.
     */
    interrupt(): void;
    /**
     * Starts audio input processing.
     *
     * Note: This is a placeholder implementation. In a real scenario, you would
     * use libraries like 'mic', 'naudiodon', or 'node-record-lpcm16' to capture
     * actual microphone input.
     */
    private _startAudioInput;
    /**
     * Starts audio output processing.
     *
     * Note: This is a placeholder implementation. In a real scenario, you would
     * use libraries like 'speaker', 'naudiodon', or similar to play audio
     * through the system speakers.
     */
    private _startAudioOutput;
}
/**
 * Creates a new DefaultAudioInterface instance.
 *
 * @returns A new DefaultAudioInterface instance
 */
export declare function createDefaultAudioInterface(): DefaultAudioInterface;
