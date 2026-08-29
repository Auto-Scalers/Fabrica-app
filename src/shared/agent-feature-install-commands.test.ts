import { describe, expect, it } from 'vitest'
import {
  buildAgentFeatureSkillInstallArgs,
  buildAgentFeatureSkillInstallCommand,
  FABRICA_CLI_SKILL_INSTALL_COMMAND,
  buildAgentFeatureSkillUpdateArgs,
  buildAgentFeatureSkillUpdateCommand,
  COMPUTER_USE_SKILL_UPDATE_COMMAND,
  EPHEMERAL_VMS_SKILL_UPDATE_COMMAND,
  LINEAR_TICKETS_SKILL_UPDATE_COMMAND,
  FABRICA_LINEAR_SKILL_UPDATE_COMMAND,
  FABRICA_CLI_ORCHESTRATION_SKILL_INSTALL_COMMAND,
  FABRICA_CLI_SKILL_UPDATE_COMMAND,
  ORCHESTRATION_SKILL_UPDATE_COMMAND
} from './agent-feature-install-commands'

describe('agent feature skill commands', () => {
  it('builds a global install command by default', () => {
    expect(buildAgentFeatureSkillInstallCommand(['FABRICA-cli'])).toBe(
      'npx skills add https://github.com/Auto-Scalers/Fabrica-app --skill FABRICA-cli --global'
    )
  })

  it('drops --global when installing locally', () => {
    expect(buildAgentFeatureSkillInstallCommand(['FABRICA-cli'], { global: false })).toBe(
      'npx skills add https://github.com/Auto-Scalers/Fabrica-app --skill FABRICA-cli'
    )
  })

  it('repeats --skill per name for multi-skill installs', () => {
    expect(buildAgentFeatureSkillInstallCommand(['FABRICA-cli', 'orchestration'])).toBe(
      'npx skills add https://github.com/Auto-Scalers/Fabrica-app --skill FABRICA-cli --skill orchestration --global'
    )
    expect(buildAgentFeatureSkillInstallArgs(['FABRICA-cli', 'orchestration'])).toEqual([
      'skills',
      'add',
      'https://github.com/Auto-Scalers/Fabrica-app',
      '--skill',
      'FABRICA-cli',
      '--skill',
      'orchestration',
      '--global'
    ])
  })

  it('keeps the copyable Settings commands interactive by default', () => {
    // Why: -y skips the agent picker. A human pasting from Settings should still
    // get it; only an unattended spawn opts in.
    expect(buildAgentFeatureSkillInstallCommand(['FABRICA-cli'])).not.toContain('-y')
    expect(buildAgentFeatureSkillUpdateCommand('FABRICA-cli')).not.toContain('-y')
    expect(FABRICA_CLI_SKILL_INSTALL_COMMAND).not.toContain('-y')
    expect(FABRICA_CLI_SKILL_UPDATE_COMMAND).not.toContain('-y')
  })

  it('refuses to skip prompts without an install target', () => {
    // Why: -y with no --agent is the one combination that makes `skills add`
    // install into every agent it knows (~75). No caller may express it.
    expect(() => buildAgentFeatureSkillInstallCommand(['FABRICA-cli'], { yes: true })).toThrow(
      'An install target is required when skipping prompts.'
    )
  })

  it('refuses a target the skills CLI would drop', () => {
    // Why: defence in depth behind the CLI's own check — the skills CLI silently
    // drops a `-`-leading --agent value, which empties its target list and
    // installs into every agent it knows.
    expect(() =>
      buildAgentFeatureSkillInstallCommand(['FABRICA-cli'], { yes: true, agents: ['-y'] })
    ).toThrow('"-y" is not a usable install target.')
    expect(() =>
      buildAgentFeatureSkillInstallArgs(['FABRICA-cli'], {
        yes: true,
        agents: ['universal', 'a b']
      })
    ).toThrow('"a b" is not a usable install target.')
  })

  it('appends -y and the targets for an unattended run', () => {
    expect(
      buildAgentFeatureSkillInstallCommand(['FABRICA-cli'], { yes: true, agents: ['universal'] })
    ).toBe(
      'npx skills add https://github.com/Auto-Scalers/Fabrica-app --skill FABRICA-cli --global --agent universal -y'
    )
    expect(buildAgentFeatureSkillUpdateCommand(['FABRICA-cli'], { global: false, yes: true })).toBe(
      'npx skills update FABRICA-cli --project -y'
    )
    expect(
      buildAgentFeatureSkillInstallArgs(['FABRICA-cli'], { yes: true, agents: ['universal'] }).at(
        -1
      )
    ).toBe('-y')
    expect(buildAgentFeatureSkillUpdateArgs(['FABRICA-cli'], { yes: true }).at(-1)).toBe('-y')
  })

  it('builds single-skill update commands', () => {
    expect(buildAgentFeatureSkillUpdateCommand('orchestration')).toBe(
      'npx skills update orchestration --global'
    )
  })

  it('trims and rejects blank update skill names', () => {
    expect(buildAgentFeatureSkillUpdateCommand('  FABRICA-cli  ')).toBe(
      'npx skills update FABRICA-cli --global'
    )
    expect(() => buildAgentFeatureSkillUpdateCommand('   ')).toThrow('A skill name is required.')
  })

  it('builds multi-skill update commands and selects project scope for --local', () => {
    expect(buildAgentFeatureSkillUpdateCommand(['FABRICA-cli', 'orchestration'])).toBe(
      'npx skills update FABRICA-cli orchestration --global'
    )
    expect(buildAgentFeatureSkillUpdateCommand(['FABRICA-cli'], { global: false })).toBe(
      'npx skills update FABRICA-cli --project'
    )
    expect(buildAgentFeatureSkillUpdateArgs(['FABRICA-cli'], { global: false })).toEqual([
      'skills',
      'update',
      'FABRICA-cli',
      '--project'
    ])
    expect(() => buildAgentFeatureSkillUpdateCommand([])).toThrow('A skill name is required.')
  })

  it('exports single-skill update constants without changing install bundles', () => {
    expect(FABRICA_CLI_SKILL_UPDATE_COMMAND).toBe('npx skills update fabrica-cli --global')
    expect(COMPUTER_USE_SKILL_UPDATE_COMMAND).toBe('npx skills update fabrica-computer-use --global')
    expect(ORCHESTRATION_SKILL_UPDATE_COMMAND).toBe('npx skills update fabrica-orchestration --global')
    expect(EPHEMERAL_VMS_SKILL_UPDATE_COMMAND).toBe(
      'npx skills update fabrica-per-workspace-env --global'
    )
    expect(FABRICA_LINEAR_SKILL_UPDATE_COMMAND).toBe('npx skills update fabrica-linear --global')
    expect(LINEAR_TICKETS_SKILL_UPDATE_COMMAND).toBe('npx skills update fabrica-linear-tickets --global')
    expect(FABRICA_CLI_ORCHESTRATION_SKILL_INSTALL_COMMAND).toBe(
      buildAgentFeatureSkillInstallCommand(['fabrica-cli', 'fabrica-orchestration'])
    )
  })
})
