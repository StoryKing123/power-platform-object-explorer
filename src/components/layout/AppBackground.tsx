/**
 * 应用背景装饰组件
 * 提供渐变和网格背景效果
 */
export const AppBackground = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/25 via-fuchsia-500/15 to-cyan-400/15 blur-3xl" />
      <div className="absolute -bottom-56 -left-40 h-[34rem] w-[34rem] rounded-full bg-gradient-to-tr from-cyan-500/18 via-blue-500/10 to-transparent blur-3xl" />
      <div className="absolute -right-44 top-24 h-[36rem] w-[36rem] rounded-full bg-gradient-to-tr from-purple-500/18 via-primary/12 to-transparent blur-3xl" />
      <div className="absolute inset-0 opacity-15 dark:opacity-[0.07] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
    </div>
  )
}
