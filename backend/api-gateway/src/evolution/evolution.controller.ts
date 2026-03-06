import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('evolution')
export class EvolutionController {
  constructor(private evolutionService: EvolutionService) {}

  @Post('simulations')
  createSimulation(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; agentId: string; config?: object },
  ) {
    return this.evolutionService.createSimulation(
      userId,
      body.name,
      body.agentId,
      body.config,
    );
  }

  @Get('simulations')
  getSimulations(@CurrentUser('id') userId: string) {
    return this.evolutionService.getSimulations(userId);
  }

  @Get('simulations/:id')
  getSimulation(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.evolutionService.getSimulation(id, userId);
  }

  @Post('simulations/:id/action')
  simulationAction(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('action') action: string,
  ) {
    return this.evolutionService.simulationAction(id, userId, action);
  }

  @Get('suggestions')
  getSuggestions(@Query('type') type?: string) {
    return this.evolutionService.getSuggestions(type);
  }

  @Post('feedback')
  createFeedback(
    @CurrentUser('id') userId: string,
    @Body() body: { entityType: string; entityId: string; thumbsUp: boolean },
  ) {
    return this.evolutionService.createFeedback(
      userId,
      body.entityType,
      body.entityId,
      body.thumbsUp,
    );
  }

  @Post('experiments')
  createExperiment(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; configs: object[] },
  ) {
    return this.evolutionService.createExperiment(userId, body.name, body.configs);
  }

  @Get('experiments')
  getExperiments(@CurrentUser('id') userId: string) {
    return this.evolutionService.getExperiments(userId);
  }

  @Get('experiments/:id')
  getExperiment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.evolutionService.getExperiment(id, userId);
  }

  @Post('experiments/:id/run')
  runExperiment(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.evolutionService.runExperiment(id, userId);
  }

  @Get('versions')
  getVersions(@CurrentUser('id') userId: string) {
    return this.evolutionService.getVersions(userId);
  }
}
