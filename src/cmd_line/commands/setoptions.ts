import { configuration, optionAliases } from '../../configuration/configuration';
import { VimError, ErrorCode } from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';

export enum SetOptionOperator {
  /*
   * Set string or number option to {value}.
   * White space between {option} and '=' is allowed and will be ignored.  White space between '=' and {value} is not allowed.
   */
  Equal,
  /*
   * Toggle option: set, switch it on.
   * Number option: show value.
   * String option: show value.
   */
  Set,
  /*
   * Toggle option: Reset, switch it off.
   */
  Reset,
  /**
   * Toggle option: Insert value.
   */
  Invert,
  /*
   * Add the {value} to a number option, or append the {value} to a string option.
   * When the option is a comma separated list, a comma is added, unless the value was empty.
   */
  Append,
  /*
   * Subtract the {value} from a number option, or remove the {value} from a string option, if it is there.
   */
  Subtract,
  /**
   * Multiply the {value} to a number option, or prepend the {value} to a string option.
   */
  Multiply,
  /**
   * Show value of {option}.
   */
  Info,
}

export interface IOptionArgs {
  name?: string;
  operator?: SetOptionOperator;
  value?: string | number | boolean;
}

export class SetOptionsCommand extends ExCommand {
  private readonly arguments: IOptionArgs;

  constructor(args: IOptionArgs) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    if (!this.arguments.name) {
      throw new Error('Missing argument.');
    }

    const optionName = optionAliases.get(this.arguments.name) ?? this.arguments.name;

    if (configuration[optionName] == null) {
      throw VimError.fromCode(ErrorCode.UnknownOption, optionName);
    }

    switch (this.arguments.operator) {
      case SetOptionOperator.Set:
        configuration[optionName] = true;
        break;
      case SetOptionOperator.Reset:
        configuration[optionName] = false;
        break;
      case SetOptionOperator.Equal:
        configuration[optionName] = this.arguments.value!;
        break;
      case SetOptionOperator.Invert:
        configuration[optionName] = !configuration[optionName];
        break;
      case SetOptionOperator.Append:
        configuration[optionName] += this.arguments.value!;
        break;
      case SetOptionOperator.Subtract:
        if (typeof this.arguments.value! === 'number') {
          configuration[optionName] -= this.arguments.value;
        } else {
          const initialValue = configuration[optionName];
          configuration[optionName] = initialValue.split(this.arguments.value! as string).join('');
        }
        break;
      case SetOptionOperator.Info:
        const value = configuration[optionName];
        if (value === undefined) {
          throw VimError.fromCode(ErrorCode.UnknownOption, optionName);
        } else {
          StatusBar.setText(vimState, `${optionName}=${value}`);
        }
        break;
      default:
        break;
    }
  }
}
