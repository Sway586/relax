import AVFoundation
import AppKit

/// 播放內建提示音；找不到音檔時退回系統 beep。
final class SoundService {
    private var player: AVAudioPlayer?

    func play() {
        if let url = Bundle.main.url(forResource: "chime", withExtension: "wav") {
            do {
                player = try AVAudioPlayer(contentsOf: url)
                player?.play()
                return
            } catch {
                print("播放音效失敗：\(error)")
            }
        }
        NSSound.beep()
    }
}
