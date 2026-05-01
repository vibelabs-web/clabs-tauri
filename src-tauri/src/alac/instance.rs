// 단일 alacritty_terminal 인스턴스.
// Term + tty::Pty + EventLoop를 묶어서 보유한다.
// EventLoop은 자체 스레드에서 PTY ↔ Term 사이를 펌프하므로,
// 우리 코드는 (1) 입력 바이트를 Notifier로 보내고 (2) 화면 그릴 때 Term mutex를 잡으면 된다.

use std::path::PathBuf;
use std::sync::Arc;
use std::thread::JoinHandle;

use alacritty_terminal::event::WindowSize;
use alacritty_terminal::event_loop::{EventLoop, Notifier, State as EventLoopState};
use alacritty_terminal::sync::FairMutex;
use alacritty_terminal::term::test::TermSize;
use alacritty_terminal::term::Config as TermConfig;
use alacritty_terminal::tty::{self, Options as PtyOptions, Shell};
use alacritty_terminal::Term;

use super::listener::AlacEventProxy;

pub struct AlacInstance {
    pub terminal: Arc<FairMutex<Term<AlacEventProxy>>>,
    pub notifier: Notifier,
    pub proxy: AlacEventProxy,
    /// `EventLoop::spawn`이 반환하는 join handle. drop 시점에 Shutdown 메시지 송신 후 join.
    loop_handle: Option<JoinHandle<(EventLoop<tty::Pty, AlacEventProxy>, EventLoopState)>>,
}

pub struct CreateOptions {
    pub cols: u16,
    pub rows: u16,
    pub cell_width: u16,
    pub cell_height: u16,
    pub working_directory: Option<PathBuf>,
    pub shell_program: Option<String>,
    pub shell_args: Vec<String>,
    /// macOS NSWindow id (raw window handle용). 0 이면 미지정.
    pub window_id: u64,
}

impl AlacInstance {
    pub fn new(opts: CreateOptions) -> Result<Self, String> {
        // PTY가 환경변수에 TERM=alacritty/xterm-256color, COLORTERM=truecolor를 세팅.
        tty::setup_env();

        let window_size = WindowSize {
            num_cols: opts.cols,
            num_lines: opts.rows,
            cell_width: opts.cell_width.max(1),
            cell_height: opts.cell_height.max(1),
        };

        let pty_options = PtyOptions {
            shell: opts.shell_program.map(|p| Shell::new(p, opts.shell_args)),
            working_directory: opts.working_directory,
            drain_on_exit: false,
            env: Default::default(),
        };

        let pty = tty::new(&pty_options, window_size, opts.window_id)
            .map_err(|e| format!("alac: tty::new failed: {e}"))?;

        let term_config = TermConfig::default();
        let dims = TermSize::new(opts.cols as usize, opts.rows as usize);
        let proxy = AlacEventProxy::new();
        let term = Term::new(term_config, &dims, proxy.clone());
        let terminal = Arc::new(FairMutex::new(term));

        let event_loop = EventLoop::new(terminal.clone(), proxy.clone(), pty, false, false)
            .map_err(|e| format!("alac: EventLoop::new failed: {e}"))?;

        let notifier = Notifier(event_loop.channel());
        let loop_handle = event_loop.spawn();

        Ok(Self {
            terminal,
            notifier,
            proxy,
            loop_handle: Some(loop_handle),
        })
    }

    /// 키 입력/IME 결과를 PTY로 전송.
    pub fn write_input(&self, bytes: Vec<u8>) {
        use alacritty_terminal::event::Notify;
        self.notifier.notify(bytes);
    }

    /// 창 리사이즈 알림. 호출 측에서 cols/rows/cell_*까지 계산해서 넘겨야 한다.
    pub fn on_resize(&self, ws: WindowSize) {
        use alacritty_terminal::event_loop::Msg;
        // Notifier 내부 sender로 직접 Resize 송신.
        let _ = self.notifier.0.send(Msg::Resize(ws));
        // Term의 grid도 리사이즈.
        let mut term = self.terminal.lock();
        term.resize(TermSize::new(ws.num_cols as usize, ws.num_lines as usize));
    }
}

impl Drop for AlacInstance {
    fn drop(&mut self) {
        use alacritty_terminal::event_loop::Msg;
        let _ = self.notifier.0.send(Msg::Shutdown);
        if let Some(h) = self.loop_handle.take() {
            let _ = h.join();
        }
    }
}
