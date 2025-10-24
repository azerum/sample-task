import { execa, ExecaError } from "execa"
import type { AppEnv } from '../AppEnv.js'

export interface UseAppProps {
    args: string[]
    env: AppEnv
}

export async function useApp(props: UseAppProps): Promise<AsyncDisposable> {
    const child = execa("tsx", ["src/main.ts", ...props.args], {
        env: props.env,
        stdout: 'inherit',
        stderr: 'inherit',
    })

    return {
        async [Symbol.asyncDispose]() {
            if (child.pid === undefined) {
                return
            }

            child.kill('SIGTERM')

            try {
                await child
            } 
            catch (exception) {
                if (exception instanceof ExecaError && exception.isTerminated) {
                    return
                }

                throw exception
            }
        },
    }
}
