import { Module } from '@nestjs/common';
import { RaidenxService } from 'modules/raidenx/raidenx.service';
import { RaidenxController } from 'modules/raidenx/raidenx.controller';
import { SharedModule } from 'modules/shared/shared.module';
import { AgentModule } from 'modules/agent/agent.module';
import * as providers from 'modules/raidenx/providers';
import { autoImport } from 'common/utils/common.utils';

@Module({
  imports: [SharedModule, AgentModule],
  providers: [RaidenxService, ...autoImport(providers)],
  controllers: [RaidenxController],
})
export class RaidenxModule {}
