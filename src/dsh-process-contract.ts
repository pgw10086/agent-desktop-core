/** Product Desktop 解析后的 DSH 启动命令；Core 不决定 DSH 包或 Layout 版本。 */
export interface DshCommand {
  /** 实际启动的 Node 可执行文件路径。 */
  readonly executable: string;
  /** 传给产品自有 DSH carrier 的固定参数。 */
  readonly args: readonly string[];
  /** DSH 进程工作目录。 */
  readonly cwd: string;
  /** 经过产品层整理的运行时环境。 */
  readonly env: NodeJS.ProcessEnv;
  /** 是否通过 stdin 协议请求停止。 */
  readonly stopViaStdin?: boolean;
}
